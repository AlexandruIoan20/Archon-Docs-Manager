import { useMemo } from 'react'
import type { EditorTabRef } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { registerSaveHandler, saveTab } from '@/core/editor/save-registry'
import { selectActiveTab, useEditorStore, useUiStore, type EditorTab } from '@/store'
import { useCloseGuardStore } from '../store/close-guard.store'

export { registerSaveHandler }

/**
 * Saves what can be saved. Returns the tabs still holding unsaved changes: an
 * editor without a save handler, or one whose save failed.
 */
async function saveDirty(tabIds: readonly string[]): Promise<string[]> {
  const unsaved: string[] = []
  for (const id of tabIds) {
    const tab = useEditorStore.getState().tabs.find((t) => t.id === id)
    if (tab?.dirty && !(await saveTab(id))) unsaved.push(id)
  }
  return unsaved
}

function askAbout(tabIds: string[], quit: boolean): void {
  useCloseGuardStore.getState().setPending({ tabIds, quit })
  useUiStore.getState().openModal('unsaved-changes')
}

/**
 * Closes tabs, saving dirty ones first (editors autosave, so this is usually
 * a flush). Tabs that still have unsaved changes stay open and the
 * unsaved-changes dialog asks what to do.
 */
export async function requestClose(tabIds: readonly string[]): Promise<void> {
  const unsaved = await saveDirty(tabIds)
  const { close } = useEditorStore.getState()
  for (const id of tabIds) if (!unsaved.includes(id)) close(id)
  if (unsaved.length > 0) askAbout(unsaved, false)
}

/** Answer to main's `app:before-quit`: save, ask if needed, then release the window. */
export async function requestQuit(): Promise<void> {
  const dirty = useEditorStore.getState().tabs.filter((tab) => tab.dirty)
  const unsaved = await saveDirty(dirty.map((tab) => tab.id))
  if (unsaved.length > 0) askAbout(unsaved, true)
  else await ipcClient.app.confirmClose()
}

/** Cycles to the next (`1`) or previous (`-1`) tab. */
export function cycleTab(direction: 1 | -1): void {
  const { tabs, activeId, activate } = useEditorStore.getState()
  if (tabs.length < 2) return
  const index = tabs.findIndex((tab) => tab.id === activeId)
  const next = tabs[(index + direction + tabs.length) % tabs.length]
  if (next) activate(next.id)
}

export interface ActiveTab {
  tab: EditorTab | null
  /** What editor contributions receive; stable while the tab keeps its path. */
  ref: EditorTabRef | null
}

export function useActiveTab(): ActiveTab {
  const tab = useEditorStore(selectActiveTab)
  const id = tab?.id
  const relPath = tab?.relPath
  const kind = tab?.kind
  const ref = useMemo(
    () => (id && relPath && kind ? { tabId: id, filePath: relPath, kind } : null),
    [id, relPath, kind]
  )
  return { tab, ref }
}

export interface EditorTabsApi {
  tabs: EditorTab[]
  activeId: string | null
  activate: (id: string) => void
  requestClose: (tabIds: readonly string[]) => Promise<void>
}

/** The tab store with the unsaved-changes guard on every close. */
export function useEditorTabs(): EditorTabsApi {
  const tabs = useEditorStore((s) => s.tabs)
  const activeId = useEditorStore((s) => s.activeId)
  const activate = useEditorStore((s) => s.activate)
  return { tabs, activeId, activate, requestClose }
}
