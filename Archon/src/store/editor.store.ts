import { create } from 'zustand'
import type { FileKind } from '@/core/types'
import { EXTENSION_BY_KIND } from '@/core/constants/file-extensions'
import { baseName, isSameOrInside, remapPath } from '@/core/utils/rel-path'

export interface EditorTab {
  /** Stable for the life of the tab, also across renames. */
  id: string
  relPath: string
  kind: FileKind
  /** File name without its extension. */
  title: string
  /** Unsaved changes. */
  dirty: boolean
}

/** A tab as saved in the session: just enough to reopen it. */
export interface TabSeed {
  relPath: string
  kind: FileKind
}

export interface EditorState {
  tabs: EditorTab[]
  activeId: string | null

  /** Opens a tab for the file, or activates the one already open. Returns its id. */
  openFile: (relPath: string, kind: FileKind) => string
  activate: (id: string) => void
  /** Closes without asking; the unsaved-changes guard lives in `useEditorTabs`. */
  close: (id: string) => void
  closeOthers: (id: string) => void
  closeToRight: (id: string) => void
  reorder: (from: number, to: number) => void
  setDirty: (id: string, dirty: boolean) => void
  /** Follows a rename or move of a file or of one of its folders. */
  renameTabPath: (from: string, to: string) => void
  /** Closes the tabs of `relPath` and of everything inside it. Returns the closed tabs. */
  closeByPath: (relPath: string) => EditorTab[]
  /** Replaces all tabs, e.g. with the ones saved for a workspace. */
  hydrate: (seeds: readonly TabSeed[], activePath: string | null) => void
}

let nextTabId = 1

export function titleFromPath(relPath: string, kind: FileKind): string {
  const name = baseName(relPath)
  const ext = EXTENSION_BY_KIND[kind]
  return name.toLowerCase().endsWith(ext) ? name.slice(0, -ext.length) : name
}

const createTab = ({ relPath, kind }: TabSeed): EditorTab => ({
  id: `tab-${nextTabId++}`,
  relPath,
  kind,
  title: titleFromPath(relPath, kind),
  dirty: false
})

/** After closing, the active tab stays if it is still open; otherwise the last tab wins. */
function nextActive(tabs: EditorTab[], activeId: string | null): string | null {
  if (activeId && tabs.some((tab) => tab.id === activeId)) return activeId
  return tabs.at(-1)?.id ?? null
}

function keep(
  state: EditorState,
  predicate: (tab: EditorTab, index: number) => boolean
): Pick<EditorState, 'tabs' | 'activeId'> {
  const tabs = state.tabs.filter(predicate)
  if (tabs.length === state.tabs.length) return state
  return { tabs, activeId: nextActive(tabs, state.activeId) }
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  tabs: [],
  activeId: null,

  openFile: (relPath, kind) => {
    const existing = get().tabs.find((tab) => tab.relPath === relPath)
    if (existing) {
      set({ activeId: existing.id })
      return existing.id
    }
    const tab = createTab({ relPath, kind })
    set((state) => ({ tabs: [...state.tabs, tab], activeId: tab.id }))
    return tab.id
  },

  activate: (id) =>
    set((state) => (state.tabs.some((t) => t.id === id) ? { activeId: id } : state)),

  close: (id) => set((state) => keep(state, (tab) => tab.id !== id)),

  closeOthers: (id) => set((state) => ({ ...keep(state, (tab) => tab.id === id), activeId: id })),

  closeToRight: (id) =>
    set((state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id)
      return index === -1 ? state : keep(state, (_tab, i) => i <= index)
    }),

  reorder: (from, to) =>
    set((state) => {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(from, 1)
      if (!moved || to < 0 || to > tabs.length) return state
      tabs.splice(to, 0, moved)
      return { tabs }
    }),

  setDirty: (id, dirty) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id)
      if (!tab || tab.dirty === dirty) return state
      return { tabs: state.tabs.map((t) => (t.id === id ? { ...t, dirty } : t)) }
    }),

  renameTabPath: (from, to) =>
    set((state) => {
      let changed = false
      const tabs = state.tabs.map((tab) => {
        const relPath = remapPath(tab.relPath, from, to)
        if (relPath === tab.relPath) return tab
        changed = true
        return { ...tab, relPath, title: titleFromPath(relPath, tab.kind) }
      })
      return changed ? { tabs } : state
    }),

  closeByPath: (relPath) => {
    const closed = get().tabs.filter((tab) => isSameOrInside(tab.relPath, relPath))
    if (closed.length > 0) set((state) => keep(state, (tab) => !closed.includes(tab)))
    return closed
  },

  hydrate: (seeds, activePath) => {
    const unique = seeds.filter(
      (seed, i) => seeds.findIndex((s) => s.relPath === seed.relPath) === i
    )
    const tabs = unique.map(createTab)
    const active = tabs.find((tab) => tab.relPath === activePath) ?? tabs.at(-1)
    set({ tabs, activeId: active?.id ?? null })
  }
}))

export function selectActiveTab(state: EditorState): EditorTab | null {
  return state.tabs.find((tab) => tab.id === state.activeId) ?? null
}

export function selectActivePath(state: EditorState): string | null {
  return selectActiveTab(state)?.relPath ?? null
}
