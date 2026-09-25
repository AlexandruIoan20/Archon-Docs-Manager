import { vi, type Mock } from 'vitest'
import type { FolderEntry, IpcErrorPayload, Result, ArchonApi, WorkspaceInfo } from '@/core/types'

export type MockedSection<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? Mock<T[K]> : T[K]
}

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const fail = (code: IpcErrorPayload['code'], message: string = code): Result<never> => ({
  ok: false,
  error: { code, message }
})

export const SAMPLE_WORKSPACE: WorkspaceInfo = {
  id: '6f1c2f0e-8f1a-4b8a-9d1e-2b7c4d5e6f70',
  name: 'SecOps Core',
  rootName: 'secops-core',
  settings: { theme: 'inherit', defaultDiagramType: 'flowchart' }
}

export const EMPTY_TREE: FolderEntry = {
  kind: 'folder',
  name: 'secops-core',
  relPath: '',
  children: []
}

export interface WorkspaceMockOptions {
  /** The workspace main reports as open; `null` for the landing screen. */
  workspace?: WorkspaceInfo | null
  tree?: FolderEntry
}

/** Fake `window.archon.workspace`: a small in-memory main process. */
export function createWorkspaceApiMock(
  options: WorkspaceMockOptions = {}
): MockedSection<ArchonApi['workspace']> {
  let current = options.workspace === undefined ? SAMPLE_WORKSPACE : options.workspace
  const tree = options.tree ?? EMPTY_TREE
  const open = (info: WorkspaceInfo): Promise<Result<WorkspaceInfo>> => {
    current = info
    return Promise.resolve(ok(info))
  }

  return {
    create: vi.fn((name: string) =>
      open({ ...SAMPLE_WORKSPACE, name: name || SAMPLE_WORKSPACE.name })
    ),
    openDialog: vi.fn(() => open(SAMPLE_WORKSPACE)),
    openRecent: vi.fn(() => open(SAMPLE_WORKSPACE)),
    close: vi.fn(() => {
      current = null
      return Promise.resolve(ok(null))
    }),
    getCurrent: vi.fn(() => Promise.resolve(ok(current))),
    updateSettings: vi.fn((patch) => {
      if (!current) return Promise.resolve(fail('NO_WORKSPACE'))
      current = { ...current, settings: { ...current.settings, ...patch } }
      return Promise.resolve(ok(current))
    }),
    readTree: vi.fn(() => Promise.resolve(current ? ok(tree) : fail('NO_WORKSPACE'))),
    reveal: vi.fn(() => Promise.resolve(ok(null)))
  }
}
