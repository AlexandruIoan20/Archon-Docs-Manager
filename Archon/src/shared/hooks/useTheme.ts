import { useCallback, useEffect, useLayoutEffect } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ResolvedTheme, ThemePreference } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { useUiStore } from '@/store'
import { applyTheme, readTitleBarColors, resolveTheme } from '@/shared/utils/apply-theme'
import { usePlatform } from './usePlatform'
import { useSettings, useUpdateSettings } from './useSettings'

/** The OS theme; kept fresh by the `system:theme-changed` event. */
export const systemThemeQuery = queryOptions({
  queryKey: QUERY_KEYS.systemTheme,
  queryFn: ipcClient.system.getTheme,
  staleTime: Infinity
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

/**
 * Owns the theme: applies it to the document, mirrors it into `ui.store` and
 * recolors the native Windows controls. Call it once, in `App.tsx`.
 */
export function useTheme(): ThemeControls {
  const { theme: preference, accent } = useSettings().appearance
  const systemTheme = useSystemTheme(preference === 'system')
  const resolvedTheme = resolveTheme(preference, systemTheme)
  const platform = usePlatform()
  const setResolvedTheme = useUiStore((s) => s.setResolvedTheme)
  const { mutate: updateSettings } = useUpdateSettings()

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
    updateSettings({ appearance: { theme: resolvedTheme === 'dark' ? 'light' : 'dark' } })
  }, [resolvedTheme, updateSettings])

  return { preference, resolvedTheme, toggleTheme }
}
