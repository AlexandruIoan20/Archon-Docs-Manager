import { useCallback, useEffect, useLayoutEffect } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ResolvedTheme, ThemePreference, WorkspaceInfo } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { useUiStore, useWorkspaceStore } from '@/store'
import { applyTheme, readTitleBarColors, resolveTheme } from '@/shared/utils/apply-theme'
import { usePlatform } from './usePlatform'
import { useSettings, useUpdateSettings } from './useSettings'

/** The OS theme; kept fresh by the `system:theme-changed` event. */
export const systemThemeQuery = queryOptions({
  queryKey: QUERY_KEYS.systemTheme,
  queryFn: ipcClient.system.getTheme,
  staleTime: Infinity,
  retry: false
})

export interface ThemeControls {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  /** Switches explicitly between dark and light (leaves `system`). */
  toggleTheme: () => void
}

function useSystemTheme(enabled: boolean): ResolvedTheme | undefined {
  const queryClient = useQueryClient()
  const { data } = useQuery({ ...systemThemeQuery, enabled })

  useEffect(() => {
    if (!enabled || !ipcClient.isAvailable()) return
    return ipcClient.on('system:theme-changed', (theme) => {
      queryClient.setQueryData(systemThemeQuery.queryKey, theme)
    })
  }, [enabled, queryClient])

  return data
}

/** Writes a workspace theme override and updates the cached workspace. */
function useSetWorkspaceTheme(): (theme: ResolvedTheme) => void {
  const queryClient = useQueryClient()
  return useCallback(
    (theme) => {
      ipcClient.workspace
        .updateSettings({ theme })
        .then((info) => queryClient.setQueryData<WorkspaceInfo>(QUERY_KEYS.workspaceCurrent, info))
        .catch((error: Error) => useUiStore.getState().notify(error.message, 'error'))
    },
    [queryClient]
  )
}

/**
 * Owns the theme: applies it to the document, mirrors it into `ui.store` and
 * recolors the native Windows controls. Call it once, in `App.tsx`.
 * A workspace theme (`.soarws` `settings.theme` other than `inherit`) wins over
 * the app preference, and the toggle then edits the workspace.
 */
export function useTheme(): ThemeControls {
  const appearance = useSettings().appearance
  const override = useWorkspaceStore((s) => s.current?.settings.theme ?? 'inherit')
  const preference = override === 'inherit' ? appearance.theme : override
  const { accent } = appearance
  const systemTheme = useSystemTheme(preference === 'system')
  const resolvedTheme = resolveTheme(preference, systemTheme)
  const platform = usePlatform()
  const setResolvedTheme = useUiStore((s) => s.setResolvedTheme)
  const { mutate: updateSettings } = useUpdateSettings()
  const setWorkspaceTheme = useSetWorkspaceTheme()

  // Layout effect: the new colors land in the same frame as the toggle click.
  useLayoutEffect(() => {
    applyTheme(resolvedTheme, accent)
    setResolvedTheme(resolvedTheme)
  }, [resolvedTheme, accent, setResolvedTheme])

  useEffect(() => {
    if (platform !== 'win32') return
    const colors = readTitleBarColors()
    if (colors) void ipcClient.window.setTitleBarColors(colors).catch(console.error)
  }, [platform, resolvedTheme])

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    if (override === 'inherit') updateSettings({ appearance: { theme: next } })
    else setWorkspaceTheme(next)
  }, [override, resolvedTheme, setWorkspaceTheme, updateSettings])

  return { preference, resolvedTheme, toggleTheme }
}
