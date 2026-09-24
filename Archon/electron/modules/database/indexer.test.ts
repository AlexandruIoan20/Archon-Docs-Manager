// @vitest-environment node
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IndexProgress } from '@/core/types'
import { openDatabase, type SqliteDatabase } from './db'
import { createIndexer } from './indexer'
import { WORKSPACE_MIGRATIONS } from './migrations/001_initial'
import { createSearchRepo } from './repositories/search.repo'

const NOW = '2026-09-01T10:00:00.000Z'

const docJson = (id: string, title: string, text = ''): object => ({
  version: '1.0.0',
  id,
  title,
  created: NOW,
  lastModified: NOW,
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
})

const diagramJson = (id: string): object => ({
  version: '1.0.0',
  id,
  title: 'Phishing response',
  created: NOW,
  lastModified: NOW,
  data: {
    nodes: [
      {
        id: 'N2',
        type: 'action',
        position: { x: 0, y: 0 },
        data: { label: 'Contain Host', description: 'Isolates the endpoint via EDR' }
      }
    ]
  }
})

describe('indexer', () => {
  let root: string
  let db: SqliteDatabase

  const write = async (rel: string, data: unknown): Promise<void> => {
    const path = join(root, rel)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, typeof data === 'string' ? data : JSON.stringify(data))
  }
  const paths = (): string[] =>
    db.prepare<[], string>('SELECT rel_path FROM files ORDER BY rel_path').pluck().all()

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'soar-index-'))
    db = openDatabase(':memory:', WORKSPACE_MIGRATIONS)
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    db.close()
    await rm(root, { recursive: true, force: true })
  })

  it('indexes the workspace, then only what changed', async () => {
    await write('runbooks/a.soardoc', docJson('a', 'Alpha'))
    await write('flows/p.soardiag', diagramJson('p'))
    await write('notes.txt', 'not an app file')
    await write('.hidden/x.soardoc', docJson('x', 'Hidden'))
    const indexer = createIndexer({ db, root })

    expect(await indexer.fullSync()).toEqual({ indexed: 2, removed: 0, unchanged: 0, skipped: 0 })
    expect(paths()).toEqual(['flows/p.soardiag', 'runbooks/a.soardoc'])
    expect(createSearchRepo(db).query('isolate')[0]?.nodeLabel).toBe('Contain Host')

    // An unchanged workspace is not read again.
    expect(await indexer.fullSync()).toEqual({ indexed: 0, removed: 0, unchanged: 2, skipped: 0 })

    await write('runbooks/a.soardoc', docJson('a', 'Alpha, second edition'))
    await utimes(join(root, 'runbooks/a.soardoc'), new Date(), new Date(Date.now() + 5000))
    await rm(join(root, 'flows'), { recursive: true })
    expect(await indexer.fullSync()).toEqual({ indexed: 1, removed: 1, unchanged: 0, skipped: 0 })
    expect(paths()).toEqual(['runbooks/a.soardoc'])
    expect(createSearchRepo(db).query('edition')).toHaveLength(1)
  })

  it('skips an invalid file without stopping the sync', async () => {
    await write('broken.soardoc', '{ not json')
    await write('wrong.soardiag', { title: 42 })
    await write('good.soardoc', docJson('g', 'Good'))
    const indexer = createIndexer({ db, root })

    expect(await indexer.fullSync()).toMatchObject({ indexed: 1, skipped: 2 })
    expect(paths()).toEqual(['good.soardoc'])
    expect(indexer.getStatus()).toMatchObject({ indexing: false, files: 1, skipped: 2 })
    expect(indexer.getStatus().lastSync).not.toBeNull()
  })

  it('syncs a single file or folder', async () => {
    const indexer = createIndexer({ db, root })
    await indexer.fullSync()

    await write('ops/a.soardoc', docJson('a', 'A'))
    await write('ops/sub/b.soardoc', docJson('b', 'B'))
    await indexer.syncPath('ops')
    expect(paths()).toEqual(['ops/a.soardoc', 'ops/sub/b.soardoc'])

    await rm(join(root, 'ops/sub'), { recursive: true })
    await indexer.syncPath('ops/sub')
    expect(paths()).toEqual(['ops/a.soardoc'])

    await rm(join(root, 'ops/a.soardoc'))
    await indexer.syncPath('ops/a.soardoc')
    expect(paths()).toEqual([])
  })

  it('refuses paths outside the workspace', async () => {
    await expect(createIndexer({ db, root }).syncPath('../etc')).rejects.toMatchObject({
      code: 'PATH_OUTSIDE_WORKSPACE'
    })
  })

  it('works in batches and reports progress', async () => {
    for (let i = 0; i < 7; i++) await write(`f${i}.soardoc`, docJson(`id-${i}`, `File ${i}`))
    const progress: IndexProgress[] = []
    const indexer = createIndexer({ db, root, batchSize: 3, onProgress: (p) => progress.push(p) })

    await indexer.fullSync()
    expect(paths()).toHaveLength(7)
    expect(progress.map((p) => `${p.state}:${p.done}/${p.total}`)).toEqual([
      'indexing:0/0',
      'indexing:0/7',
      'indexing:3/7',
      'indexing:6/7',
      'idle:0/0'
    ])
  })

  it('runs operations one after another and stops after dispose', async () => {
    for (let i = 0; i < 6; i++) await write(`f${i}.soardoc`, docJson(`id-${i}`, `File ${i}`))
    const indexer = createIndexer({ db, root, batchSize: 2 })

    const sync = indexer.fullSync()
    const single = indexer.syncPath('f0.soardoc', true)
    await indexer.dispose()
    await Promise.all([sync, single])
    expect(paths().length).toBeLessThan(6)
  })
})
