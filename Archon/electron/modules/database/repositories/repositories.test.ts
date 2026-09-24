// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import type { SoarDiagram, SoarDocument } from '@/core/types'
import { SEARCH_MATCH_END, SEARCH_MATCH_START } from '@/core/constants/search.constants'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { documentFileSchema } from '@/core/schemas/document.schema'
import { openDatabase, type SqliteDatabase } from '../db'
import { APP_MIGRATIONS } from '../migrations/app/001_projects'
import { WORKSPACE_MIGRATIONS } from '../migrations/001_initial'
import { createDiagramsRepo } from './diagrams.repo'
import { createDocumentsRepo } from './documents.repo'
import { createProjectsRepo } from './projects.repo'
import { createSearchRepo, toFtsQuery } from './search.repo'

const NOW = '2026-09-01T10:00:00.000Z'
const STAT = { mtimeMs: 1000.7, size: 42 }

const doc = (overrides: Partial<SoarDocument> = {}): SoarDocument =>
  documentFileSchema.parse({
    version: '1.0.0',
    id: 'doc-1',
    title: 'Containment runbook',
    created: NOW,
    lastModified: NOW,
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quarantine the mailbox' }] }]
    },
    tags: ['ir', 'email'],
    linkedDiagrams: ['diag-1'],
    ...overrides
  })

const phishingDiagram = (overrides: Partial<SoarDiagram> = {}): SoarDiagram =>
  diagramFileSchema.parse({
    version: '1.0.0',
    id: 'diag-1',
    title: 'Phishing response',
    created: NOW,
    lastModified: NOW,
    tags: ['ir'],
    data: {
      nodes: [
        { id: 'N1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Alert received' } },
        {
          id: 'N2',
          type: 'action',
          position: { x: 0, y: 100 },
          data: {
            label: 'Contain Host',
            subtitle: 'EDR',
            description: 'Isolates the endpoint via EDR',
            tags: ['edr']
          }
        }
      ]
    },
    ...overrides
  })

describe('workspace repositories', () => {
  let db: SqliteDatabase

  beforeEach(() => {
    db = openDatabase(':memory:', WORKSPACE_MIGRATIONS)
  })

  it('stores a document with tags and diagram links', () => {
    const documents = createDocumentsRepo(db)
    documents.upsert('runbooks/containment.soardoc', doc(), STAT)

    expect(documents.getByPath('runbooks/containment.soardoc')).toMatchObject({
      id: 'doc-1',
      kind: 'soardoc',
      title: 'Containment runbook',
      mtimeMs: 1000,
      size: 42
    })
    expect(documents.listByTag('ir').map((row) => row.id)).toEqual(['doc-1'])
    expect(db.prepare('SELECT diagram_id FROM doc_links').pluck().all()).toEqual(['diag-1'])
  })

  it('replaces the previous rows on upsert and removes them all', () => {
    const documents = createDocumentsRepo(db)
    documents.upsert('a.soardoc', doc(), STAT)
    documents.upsert('a.soardoc', doc({ title: 'Renamed', tags: ['new'] }), STAT)

    expect(documents.getByPath('a.soardoc')?.title).toBe('Renamed')
    expect(db.prepare('SELECT tag FROM file_tags').pluck().all()).toEqual(['new'])
    expect(db.prepare('SELECT COUNT(*) FROM search_fts').pluck().get()).toBe(1)

    expect(documents.remove('a.soardoc')).toBe(1)
    for (const table of ['files', 'file_tags', 'doc_links', 'search_fts']) {
      expect(db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get()).toBe(0)
    }
  })

  it('gives a copied file with a duplicate id its own row', () => {
    const documents = createDocumentsRepo(db)
    documents.upsert('a.soardoc', doc(), STAT)
    const copyId = documents.upsert('copy/a.soardoc', doc(), STAT)

    expect(copyId).toBe('doc-1@copy/a.soardoc')
    expect(documents.getByPath('a.soardoc')?.id).toBe('doc-1')
  })

  it('removes everything under a folder', () => {
    const documents = createDocumentsRepo(db)
    documents.upsert('ops/a.soardoc', doc({ id: 'a' }), STAT)
    documents.upsert('ops/sub/b.soardoc', doc({ id: 'b' }), STAT)
    documents.upsert('ops-other/c.soardoc', doc({ id: 'c' }), STAT)

    expect(documents.remove('ops')).toBe(2)
    expect(documents.getByPath('ops-other/c.soardoc')).toBeDefined()
  })

  it('stores diagram nodes with cascading deletes', () => {
    const diagrams = createDiagramsRepo(db)
    diagrams.upsert('flows/phishing.soardiag', phishingDiagram(), STAT)

    expect(diagrams.getByPath('flows/phishing.soardiag')?.diagramType).toBe('flowchart')
    expect(diagrams.listNodes('diag-1').map((node) => node.label)).toEqual([
      'Alert received',
      'Contain Host'
    ])
    expect(db.prepare('SELECT COUNT(*) FROM search_fts').pluck().get()).toBe(3)

    diagrams.remove('flows/phishing.soardiag')
    for (const table of ['diagram_nodes', 'node_tags', 'search_fts']) {
      expect(db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get()).toBe(0)
    }
  })

  it('finds the „Contain Host” node by a word of its description', () => {
    createDiagramsRepo(db).upsert('flows/phishing.soardiag', phishingDiagram(), STAT)
    createDocumentsRepo(db).upsert('runbooks/containment.soardoc', doc(), STAT)

    const [hit, ...rest] = createSearchRepo(db).query('isolate')
    expect(rest).toEqual([])
    expect(hit).toMatchObject({
      fileId: 'diag-1',
      relPath: 'flows/phishing.soardiag',
      kind: 'soardiag',
      fileTitle: 'Phishing response',
      nodeId: 'N2',
      nodeLabel: 'Contain Host'
    })
    expect(hit?.snippet).toContain(`${SEARCH_MATCH_START}Isolates${SEARCH_MATCH_END}`)
  })

  it('searches document text, ignores diacritics and FTS syntax', () => {
    createDocumentsRepo(db).upsert(
      'a.soardoc',
      doc({ title: 'Răspuns la incident', tags: [] }),
      STAT
    )
    const search = createSearchRepo(db)
    expect(search.query('raspuns')).toHaveLength(1)
    expect(search.query('quarantine mailbox')[0]?.nodeId).toBeNull()
    expect(search.query('NEAR( " OR *')).toEqual([])
    expect(search.query('   ')).toEqual([])
  })

  it('counts tags from files and nodes', () => {
    createDiagramsRepo(db).upsert('p.soardiag', phishingDiagram(), STAT)
    createDocumentsRepo(db).upsert('a.soardoc', doc(), STAT)
    expect(createSearchRepo(db).listTags()).toEqual([
      { tag: 'ir', count: 2 },
      { tag: 'edr', count: 1 },
      { tag: 'email', count: 1 }
    ])
  })
})

describe('toFtsQuery', () => {
  it('turns words into quoted prefix terms', () => {
    expect(toFtsQuery('contain  host!')).toBe('"contain"* "host"*')
    expect(toFtsQuery('"--')).toBeNull()
  })
})

describe('projects repository', () => {
  it('touches and lists projects, most recent first', () => {
    const projects = createProjectsRepo(openDatabase(':memory:', APP_MIGRATIONS))
    projects.touch({ id: 'a', name: 'A', rootPath: '/a' }, new Date('2026-01-01'))
    projects.touch({ id: 'b', name: 'B', rootPath: '/b' }, new Date('2026-02-01'))
    projects.touch({ id: 'a', name: 'A2', rootPath: '/a2' }, new Date('2026-03-01'))

    expect(projects.list().map((p) => [p.id, p.name, p.rootPath])).toEqual([
      ['a', 'A2', '/a2'],
      ['b', 'B', '/b']
    ])
  })
})
