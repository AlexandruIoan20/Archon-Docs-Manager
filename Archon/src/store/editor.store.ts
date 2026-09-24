import { create } from 'zustand'
import type { FileKind } from '@/core/types'
import { isSameOrInside, remapPath } from '@/core/utils/rel-path'

export interface EditorState {
  /** Workspace-relative path of the file shown in the main area. */
  activePath: string | null
  activeKind: FileKind | null
  openFile: (relPath: string, kind: FileKind) => void
  closeActive: () => void
  /** Follows a rename or move of the active file or one of its folders. */
  renamePath: (from: string, to: string) => void
  /** Closes the active file if it is `relPath` or inside it (deleted). */
  closeByPath: (relPath: string) => void
}

/**
 * Minimal on purpose: the file tree needs somewhere to open files.
 * Plan 11 turns this into the full tab store.
 */
export const useEditorStore = create<EditorState>()((set) => ({
  activePath: null,
  activeKind: null,
  openFile: (activePath, activeKind) => set({ activePath, activeKind }),
  closeActive: () => set({ activePath: null, activeKind: null }),
  renamePath: (from, to) =>
    set((state) =>
      state.activePath === null ? state : { activePath: remapPath(state.activePath, from, to) }
    ),
  closeByPath: (relPath) =>
    set((state) =>
      state.activePath !== null && isSameOrInside(state.activePath, relPath)
        ? { activePath: null, activeKind: null }
        : state
    )
}))
