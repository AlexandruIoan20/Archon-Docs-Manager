import { BrowserWindow, nativeTheme } from 'electron'
import type { ResolvedTheme, SettingsPatch } from '@/core/types'
import { getSettingsStore } from '../settings'
import { handle, send } from './typed-ipc'

export function systemTheme(): ResolvedTheme {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

function assertPatch(patch: SettingsPatch): void {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    throw new Error('Invalid settings patch: expected an object')
  }
}

export function registerSettingsHandlers(): void {
  handle('settings:get', () => getSettingsStore().get())

  handle('settings:update', (_event, patch) => {
    assertPatch(patch)
    // Values are validated field by field while merging.
    return getSettingsStore().update(patch)
  })

  handle('system:get-theme', () => systemTheme())

  nativeTheme.on('updated', () => {
    const theme = systemTheme()
    for (const window of BrowserWindow.getAllWindows()) {
      send(window, 'system:theme-changed', theme)
    }
  })
}
