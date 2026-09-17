/**
 * Single source of truth for every IPC channel between main and renderer.
 * Main registers handlers against this map, preload invokes against it and the
 * renderer consumes the resulting `SoarApi` — a mismatch fails at compile time.
 */

export type AppPlatform = 'darwin' | 'win32' | 'linux'

export interface AppInfo {
  name: string
  version: string
  platform: AppPlatform
}

/** Colors of the native window controls drawn by the OS (Windows overlay). */
export interface TitleBarColors {
  /** Background, `#RRGGBB`. */
  color: string
  /** Glyph color, `#RRGGBB`. */
  symbolColor: string
}

/** Renderer → main request/response channels (`ipcRenderer.invoke`). */
export interface IpcInvokeContract {
  'app:get-info': { args: []; result: AppInfo }
  'window:minimize': { args: []; result: void }
  'window:toggle-maximize': { args: []; result: void }
  'window:close': { args: []; result: void }
  'window:is-maximized': { args: []; result: boolean }
  'window:set-titlebar-colors': { args: [colors: TitleBarColors]; result: void }
}

export type IpcChannel = keyof IpcInvokeContract
export type IpcArgs<C extends IpcChannel> = IpcInvokeContract[C]['args']
export type IpcResult<C extends IpcChannel> = IpcInvokeContract[C]['result']

/** Main → renderer push events (`webContents.send`), keyed by event name. */
export interface IpcEventContract {
  'window:maximized-changed': boolean
}

export type IpcEvent = keyof IpcEventContract
export type IpcEventPayload<E extends IpcEvent> = IpcEventContract[E]
export type IpcUnsubscribe = () => void

/** API surface exposed on `window.soar` by the preload script. */
export interface SoarApi {
  app: {
    getInfo: () => Promise<AppInfo>
  }
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    setTitleBarColors: (colors: TitleBarColors) => Promise<void>
  }
  /** Subscribes to a main-process event; returns the unsubscribe function. */
  on: <E extends IpcEvent>(
    event: E,
    callback: (payload: IpcEventPayload<E>) => void
  ) => IpcUnsubscribe
}
