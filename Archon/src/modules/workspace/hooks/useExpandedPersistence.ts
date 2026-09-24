import { useEffect, useEffectEvent } from 'react'
import { selectExpandedPaths, useWorkspaceStore } from '@/store'
import { useSettings, useUpdateSettings } from '@/shared/hooks/useSettings'

export const EXPANDED_SAVE_DELAY_MS = 500

/**
 * Restores the expanded folders of the open workspace and saves changes to
 * `settings.session.expandedByWorkspace[workspaceId]`.
 */
export function useExpandedPersistence(): void {
  const workspaceId = useWorkspaceStore((s) => s.current?.id)
  const saved = useSettings().session.expandedByWorkspace
  const { mutate: updateSettings } = useUpdateSettings()

  const restore = useEffectEvent((id: string) => {
    useWorkspaceStore.getState().hydrateExpanded(saved?.[id] ?? [])
  })
  const save = useEffectEvent((id: string, paths: string[]) => {
    const current = saved?.[id] ?? []
    if (current.length === paths.length && current.every((path, i) => path === paths[i])) return
    updateSettings({ session: { expandedByWorkspace: { [id]: paths } } })
  })

  useEffect(() => {
    if (!workspaceId) return
    restore(workspaceId)

    let timer: number | undefined
    const unsubscribe = useWorkspaceStore.subscribe((state, prev) => {
      if (state.expanded === prev.expanded || state.current?.id !== workspaceId) return
      window.clearTimeout(timer)
      timer = window.setTimeout(
        () => save(workspaceId, selectExpandedPaths(useWorkspaceStore.getState())),
        EXPANDED_SAVE_DELAY_MS
      )
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [workspaceId])
}
