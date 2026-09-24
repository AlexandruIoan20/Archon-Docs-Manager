// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { documentFileSchema } from '@/core/schemas/document.schema'
import { createDiagram, readDiagram, writeDiagram } from './diagrams'
import { createDocument, readDocument, writeDocument } from './documents'

const T0 = new Date('2026-03-01T10:00:00Z')
const T1 = new Date('2026-03-02T11:00:00Z')

describe('documents and diagrams', () => {
  let root: string

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'soar-files-')))
    mkdirSync(join(root, 'Playbooks'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const json = (rel: string): unknown => JSON.parse(readFileSync(join(root, rel), 'utf8'))

  it('creates untitled-1, untitled-2… without overwriting', async () => {
    const first = await createDocument(root, 'Playbooks', undefined, T0)
    const second = await createDocument(root, 'Playbooks', undefined, T0)
    expect(first).toMatchObject({
      relPath: 'Playbooks/untitled-1.soardoc',
      name: 'untitled-1.soardoc'
    })
    expect(second.relPath).toBe('Playbooks/untitled-2.soardoc')
    expect(first.document.id).not.toBe(second.document.id)

    const onDisk = documentFileSchema.parse(json(first.relPath))
    expect(onDisk).toMatchObject({
      version: '1.0.0',
      title: 'untitled-1',
      created: '2026-03-01T10:00:00.000Z',
      content: { type: 'doc', content: [] }
    })
  })

  it('names a titled document after its title', async () => {
    const created = await createDocument(root, '', 'Incident Response Policy')
    expect(created.relPath).toBe('incident-response-policy.soardoc')
    expect(created.document.title).toBe('Incident Response Policy')
  })

  it('refuses a missing folder and paths outside the workspace', async () => {
    await expect(createDocument(root, 'Nope')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(createDocument(root, '../..')).rejects.toMatchObject({
      code: 'PATH_OUTSIDE_WORKSPACE'
    })
  })

  it('reads back what it writes, keeping identity and updating lastModified', async () => {
    const { relPath, document } = await createDocument(root, '', undefined, T0)
    const saved = await writeDocument(
      root,
      relPath,
      {
        ...document,
        id: 'forged',
        created: '2000-01-01T00:00:00Z',
        title: 'Renamed',
        tags: ['ir']
      },
      T1
    )
    expect(saved).toMatchObject({
      id: document.id,
      created: document.created,
      title: 'Renamed',
      tags: ['ir'],
      lastModified: '2026-03-02T11:00:00.000Z'
    })
    expect(await readDocument(root, relPath)).toEqual(saved)
  })

  it('validates before writing and leaves the file untouched on failure', async () => {
    const { relPath, document } = await createDocument(root, '')
    const before = readFileSync(join(root, relPath), 'utf8')
    await expect(
      writeDocument(root, relPath, { ...document, content: { type: 'nope' } })
    ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
    expect(readFileSync(join(root, relPath), 'utf8')).toBe(before)
  })

  it('reports invalid files with the zod details', async () => {
    writeFileSync(join(root, 'broken.soardoc'), JSON.stringify({ version: '1.0.0', title: 3 }))
    await expect(readDocument(root, 'broken.soardoc')).rejects.toMatchObject({
      code: 'INVALID_FILE',
      details: expect.arrayContaining([expect.objectContaining({ path: 'title' })])
    })
  })

  it('refuses to treat other files as documents or diagrams', async () => {
    await expect(readDocument(root, 'workspace.soarws')).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
    await expect(readDiagram(root, 'Playbooks/x.soardoc')).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
  })

  it('creates flowchart-N diagrams with starter nodes', async () => {
    const created = await createDiagram(root, 'Playbooks', {
      type: 'flowchart',
      nodes: [{ id: 'N1', type: 'trigger', position: { x: 40, y: 250 }, data: { label: 'Alert' } }]
    })
    expect(created.relPath).toBe('Playbooks/flowchart-1.soardiag')
    const onDisk = diagramFileSchema.parse(json(created.relPath))
    expect(onDisk).toMatchObject({ type: 'flowchart', engine: 'react-flow', title: 'flowchart-1' })
    expect(onDisk.data.nodes[0]?.data).toMatchObject({ label: 'Alert', retryOnFail: false })

    const next = await createDiagram(root, 'Playbooks', { type: 'flowchart' })
    expect(next.relPath).toBe('Playbooks/flowchart-2.soardiag')
    const uml = await createDiagram(root, '', { type: 'sequence', title: 'Login flow' })
    expect(uml.relPath).toBe('login-flow.soardiag')
  })

  it('rejects invalid diagram options before touching the disk', async () => {
    await expect(createDiagram(root, '', { type: 'venn' as never })).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
    await expect(
      createDiagram(root, '', {
        type: 'flowchart',
        nodes: [{ id: '', type: 'action', position: { x: 0, y: 0 } }]
      })
    ).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
  })

  it('saves diagram changes', async () => {
    const { relPath, diagram } = await createDiagram(root, '', { type: 'flowchart' }, T0)
    const nodes = [{ id: 'N1', type: 'action' as const, position: { x: 1, y: 2 }, data: {} }]
    const saved = await writeDiagram(
      root,
      relPath,
      { ...diagram, data: { ...diagram.data, nodes } },
      T1
    )
    expect(saved.data.nodes).toHaveLength(1)
    expect((await readDiagram(root, relPath)).lastModified).toBe('2026-03-02T11:00:00.000Z')
  })
})
