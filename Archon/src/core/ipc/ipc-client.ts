import type { AppInfo, SoarApi } from '@/core/types'

/**
 * The only renderer-side entry point to the main process. Modules call this client,
 * never `window.soar` directly, so the bridge can be mocked or swapped in one place.
 */
function bridge(): SoarApi {
  if (!window.soar) {
    throw new Error('IPC bridge unavailable: preload script did not expose window.soar')
  }
  return window.soar
}

export const ipcClient = {
  app: {
    getInfo: (): Promise<AppInfo> => bridge().app.getInfo()
  }
}
