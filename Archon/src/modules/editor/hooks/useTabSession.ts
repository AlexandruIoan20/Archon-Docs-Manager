import { useEffect, useEffectEvent, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FolderEntry, TabSession } from '@/core/types'
import { selectActivePath, useEditorStore } from '@/store'
import { settingsQuery, useSettings, useUpdateSettings } from '@/shared/hooks/useSettings'
import { collectFilePaths } from '../utils/tree-files'

export const TABS_SAVE_DELAY_MS = 500

function snapshot(): TabSession {
  const state = useEditorStore.getState()
  return {
    tabs: state.tabs.map(({ relPath, kind }) => ({ relPath, kind })),
    active: selectActivePath(state)
  }
}

const sameSession = (a: TabSession | undefined, b: TabSession): boolean =>
  a !== undefined &&
  a.active === b.active &&
  a.tabs.length === b.tabs.length &&
  a.tabs.every((tab, i) => tab.relPath === b.tabs[i]?.relPath && tab.kind === b.tabs[i]?.kind)

/**
 * Restores the open tabs of a workspace once its tree is known (files that no
 * longer exist are left out) and saves them to
 * `settings.session.tabsByWorkspace[workspaceId]`. Call it once, in `App.tsx`.
 */
export function useTabSession(
  workspaceId: string | undefined,
  tree: FolderEntry | undefined
): void {
  const saved = useSettings().session.tabsByWorkspace
  // Restoring from the defaults would start every session empty.
  const settingsLoaded = useQuery(settingsQuery).isFetched
  const { mutate: updateSettings } = useUpdateSettings()
  /** The workspace whose tabs are in the store; nothing is saved before that. */
  const restoredFor = useRef<string | null>(null)

  const restore = useEffectEvent((id: string, root: FolderEntry) => {
    const files = collectFilePaths(root)
    const session = saved?.[id]
    const tabs = session?.tabs.filter((tab) => files.has(tab.relPath)) ?? []
    useEditorStore.getState().hydrate(tabs, session?.active ?? null)
    restoredFor.current = id
  })
  const save = useEffectEvent((id: string) => {
    const next = snapshot()
    if (sameSession(saved?.[id], next)) return
    updateSettings({ session: { tabsByWorkspace: { [id]: next } } })
  })

  // Another workspace (or none): its tabs must not show the previous one's files.
  useEffect(() => {
    restoredFor.current = null
    useEditorStore.getState().hydrate([], null)
  }, [workspaceId])

  useEffect(() => {
    if (!settingsLoaded || !workspaceId || !tree || restoredFor.current === workspaceId) return
    restore(workspaceId, tree)
  }, [settingsLoaded, workspaceId, tree])

  useEffect(() => {
    if (!workspaceId) return
    let timer: number | undefined
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (restoredFor.current !== workspaceId) return
      if (state.tabs === prev.tabs && state.activeId === prev.activeId) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = undefined
        save(workspaceId)
      }, TABS_SAVE_DELAY_MS)
    })
    return () => {
      unsubscribe()
      // Leaving the workspace (or the app): a pending save happens now.
      if (timer !== undefined) {
        window.clearTimeout(timer)
        save(workspaceId)
      }
    }
  }, [workspaceId])
}
