import type {
  AppInfo,
  IpcEvent,
  IpcEventPayload,
  IpcUnsubscribe,
  SoarApi,
  TitleBarColors
} from '@/core/types'

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
  },
  window: {
    minimize: (): Promise<void> => bridge().window.minimize(),
    toggleMaximize: (): Promise<void> => bridge().window.toggleMaximize(),
    close: (): Promise<void> => bridge().window.close(),
    isMaximized: (): Promise<boolean> => bridge().window.isMaximized(),
    setTitleBarColors: (colors: TitleBarColors): Promise<void> =>
      bridge().window.setTitleBarColors(colors)
  },
  on: <E extends IpcEvent>(
    event: E,
    callback: (payload: IpcEventPayload<E>) => void
  ): IpcUnsubscribe => bridge().on(event, callback)
}
