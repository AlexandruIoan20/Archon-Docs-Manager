import { create } from 'zustand'
import type { WorkspaceInfo } from '@/core/types'
import { isSameOrInside, remapPath } from '@/core/utils/rel-path'

export type SideTab = 'files' | 'diagrams'

export interface PendingDelete {
  relPath: string
  name: string
  isFolder: boolean
}

export interface WorkspaceState {
  /** The open workspace, mirrored from the `workspace:get-current` query. */
  current: WorkspaceInfo | null
  /** Expanded folders, keyed by relative path. */
  expanded: Record<string, boolean>
  /** Where new files go ("saves to"); `''` is the root. */
  targetFolder: string
  sideTab: SideTab
  query: string
  /** Entry being renamed inline. */
  renaming: string | null
  /** Entry waiting for the delete confirmation. */
  pendingDelete: PendingDelete | null

  /** Switching workspaces resets the tree state. */
  setCurrent: (workspace: WorkspaceInfo | null) => void
  toggleExpanded: (relPath: string) => void
  setExpanded: (relPath: string, expanded: boolean) => void
  /** Loads saved expansion (plan 08 persistence). */
  hydrateExpanded: (relPaths: readonly string[]) => void
  setTargetFolder: (relPath: string) => void
  setSideTab: (tab: SideTab) => void
  setQuery: (query: string) => void
  setRenaming: (relPath: string | null) => void
  setPendingDelete: (entry: PendingDelete | null) => void
  /** Keeps expansion and target in step with a rename or move. */
  remapPaths: (from: string, to: string) => void
  /** Drops state for a deleted entry; the target falls back to its parent. */
  forgetPaths: (relPath: string, parent: string) => void
}

const TREE_DEFAULTS = {
  expanded: {},
  targetFolder: '',
  sideTab: 'files',
  query: '',
  renaming: null,
  pendingDelete: null
} as const satisfies Partial<WorkspaceState>

/**
 * Cross-module workspace state. The file tree itself lives in React Query
 * (`QUERY_KEYS.workspaceTree`), not here.
 */
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  current: null,
  ...TREE_DEFAULTS,

  setCurrent: (current) =>
    set((state) =>
      state.current?.id === current?.id ? { current } : { current, ...TREE_DEFAULTS }
    ),

  toggleExpanded: (relPath) =>
    set((state) => ({ expanded: { ...state.expanded, [relPath]: !state.expanded[relPath] } })),

  setExpanded: (relPath, value) =>
    set((state) =>
      Boolean(state.expanded[relPath]) === value
        ? state
        : { expanded: { ...state.expanded, [relPath]: value } }
    ),

  hydrateExpanded: (relPaths) =>
    set({ expanded: Object.fromEntries(relPaths.map((path) => [path, true])) }),

  setTargetFolder: (targetFolder) => set({ targetFolder }),
  setSideTab: (sideTab) => set({ sideTab }),
  setQuery: (query) => set({ query }),
  setRenaming: (renaming) => set({ renaming }),
  setPendingDelete: (pendingDelete) => set({ pendingDelete }),

  remapPaths: (from, to) =>
    set((state) => ({
      expanded: Object.fromEntries(
        Object.entries(state.expanded).map(([path, open]) => [remapPath(path, from, to), open])
      ),
      targetFolder: remapPath(state.targetFolder, from, to)
    })),

  forgetPaths: (relPath, parent) =>
    set((state) => ({
      expanded: Object.fromEntries(
        Object.entries(state.expanded).filter(([path]) => !isSameOrInside(path, relPath))
      ),
      targetFolder: isSameOrInside(state.targetFolder, relPath) ? parent : state.targetFolder
    }))
}))

/** Expanded folder paths, as saved in the settings session. */
export const selectExpandedPaths = (state: WorkspaceState): string[] =>
  Object.keys(state.expanded)
    .filter((path) => state.expanded[path])
    .sort()
