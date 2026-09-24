// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { workspaceFileSchema } from '@/core/schemas/workspace.schema'
import {
  closeWorkspace,
  createWorkspace,
  getCurrent,
  onWorkspaceLifecycle,
  openWorkspace,
  requireCurrent,
  toInfo,
  updateWorkspaceSettings
} from './workspace'

describe('workspace', () => {
  let base: string

  beforeEach(() => {
    base = realpathSync(mkdtempSync(join(tmpdir(), 'soar-workspace-')))
  })

  afterEach(async () => {
    await closeWorkspace()
    rmSync(base, { recursive: true, force: true })
  })

  const folder = (name: string): string => {
    const dir = join(base, name)
    mkdirSync(dir)
    return dir
  }

  it('creates a valid .soarws and opens the workspace', async () => {
    const dir = folder('secops')
    const created = await createWorkspace(dir, '  SecOps Core ', new Date('2026-01-02T03:04:05Z'))

    const file = workspaceFileSchema.parse(
      JSON.parse(readFileSync(join(dir, 'workspace.soarws'), 'utf8'))
    )
    expect(file).toMatchObject({
      version: '1.0.0',
      name: 'SecOps Core',
      created: '2026-01-02T03:04:05.000Z',
      settings: { theme: 'inherit', defaultDiagramType: 'flowchart' }
    })
    expect(getCurrent()).toBe(created)
    expect(toInfo(created)).toEqual({
      id: file.id,
      name: 'SecOps Core',
      rootName: 'secops',
      settings: file.settings
    })
  })

  it('names the workspace after its folder when no name is given', async () => {
    const created = await createWorkspace(folder('Runbooks'), '   ')
    expect(created.file.name).toBe('Runbooks')
  })

  it('refuses a folder that already is a workspace', async () => {
    const dir = folder('twice')
    await createWorkspace(dir, 'One')
    await expect(createWorkspace(dir, 'Two')).rejects.toMatchObject({ code: 'ALREADY_EXISTS' })
  })

  it('refuses a folder that does not exist', async () => {
    await expect(createWorkspace(join(base, 'missing'), 'X')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    })
  })

  it('opens from the folder or from the file', async () => {
    const dir = folder('ws')
    const { file } = await createWorkspace(dir, 'WS')
    await closeWorkspace()

    expect((await openWorkspace(dir)).file.id).toBe(file.id)
    expect((await openWorkspace(join(dir, 'workspace.soarws'))).root).toBe(dir)
  })

  it('reports typed errors for missing and invalid workspaces', async () => {
    await expect(openWorkspace(folder('plain'))).rejects.toMatchObject({ code: 'NOT_FOUND' })

    const broken = folder('broken')
    writeFileSync(join(broken, 'workspace.soarws'), '{"version":"1.0.0","name":""}')
    await expect(openWorkspace(broken)).rejects.toMatchObject({ code: 'INVALID_FILE' })

    const notes = join(base, 'notes.txt')
    writeFileSync(notes, 'x')
    await expect(openWorkspace(notes)).rejects.toMatchObject({ code: 'INVALID_FILE' })
  })

  it('tells listeners when workspaces open and close', async () => {
    const opened = vi.fn()
    const closed = vi.fn()
    const stop = onWorkspaceLifecycle({ opened, closed })

    const first = await createWorkspace(folder('a'), 'A')
    const second = await createWorkspace(folder('b'), 'B')
    await closeWorkspace()
    stop()

    expect(opened.mock.calls.map(([ws]) => ws.file.name)).toEqual(['A', 'B'])
    expect(closed.mock.calls.map(([ws]) => ws)).toEqual([first, second])
    expect(() => requireCurrent()).toThrow(expect.objectContaining({ code: 'NO_WORKSPACE' }))
  })

  it('updates the workspace theme override on disk', async () => {
    const dir = folder('themed')
    await createWorkspace(dir, 'Themed')
    const updated = await updateWorkspaceSettings({ theme: 'light' })

    expect(updated.file.settings.theme).toBe('light')
    const onDisk = JSON.parse(readFileSync(join(dir, 'workspace.soarws'), 'utf8'))
    expect(onDisk.settings.theme).toBe('light')
    await expect(updateWorkspaceSettings({ theme: 'sepia' as never })).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT'
    })
  })
})
