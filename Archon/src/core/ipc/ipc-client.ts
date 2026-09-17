import type {
  AppInfo,
  AppSettings,
  IpcEvent,
  IpcEventPayload,
  IpcUnsubscribe,
  ResolvedTheme,
  SettingsPatch,
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

/** Runs a bridge call; a missing bridge becomes a rejected promise, never a sync throw. */
function call<T>(run: (api: SoarApi) => Promise<T>): Promise<T> {
  try {
    return run(bridge())
  } catch (error) {
    return Promise.reject(error)
  }
}

export const ipcClient = {
  /** False in unit tests or if the preload script failed to load. */
  isAvailable: (): boolean => window.soar !== undefined,
  app: {
    getInfo: (): Promise<AppInfo> => call((api) => api.app.getInfo())
  },
  window: {
    minimize: (): Promise<void> => call((api) => api.window.minimize()),
    toggleMaximize: (): Promise<void> => call((api) => api.window.toggleMaximize()),
    close: (): Promise<void> => call((api) => api.window.close()),
    isMaximized: (): Promise<boolean> => call((api) => api.window.isMaximized()),
    setTitleBarColors: (colors: TitleBarColors): Promise<void> =>
      call((api) => api.window.setTitleBarColors(colors)),
    setZoom: (factor: number): Promise<void> => call((api) => api.window.setZoom(factor))
  },
  settings: {
    get: (): Promise<AppSettings> => call((api) => api.settings.get()),
    update: (patch: SettingsPatch): Promise<AppSettings> =>
      call((api) => api.settings.update(patch))
  },
  system: {
    getTheme: (): Promise<ResolvedTheme> => call((api) => api.system.getTheme())
  },
  /** Throws if the bridge is missing; check `isAvailable()` first where that is expected. */
  on: <E extends IpcEvent>(
    event: E,
    callback: (payload: IpcEventPayload<E>) => void
  ): IpcUnsubscribe => bridge().on(event, callback)
}
