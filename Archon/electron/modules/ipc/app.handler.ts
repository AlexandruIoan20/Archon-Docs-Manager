import { app, BrowserWindow } from 'electron'
import type { AppPlatform } from '@/core/types'
import { confirmClose, enableCloseGuard } from '../close-guard'
import { handle } from './typed-ipc'

function toAppPlatform(platform: NodeJS.Platform): AppPlatform {
  if (platform === 'darwin' || platform === 'win32') return platform
  return 'linux'
}

export function registerAppHandlers(): void {
  handle('app:get-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: toAppPlatform(process.platform)
  }))

  handle('app:enable-close-guard', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) enableCloseGuard(window)
  })

  handle('app:confirm-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) confirmClose(window)
  })
}
