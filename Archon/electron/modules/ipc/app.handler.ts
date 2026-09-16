import { app } from 'electron'
import type { AppPlatform } from '@/core/types'
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
}
