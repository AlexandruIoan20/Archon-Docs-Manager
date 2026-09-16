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

export interface IpcInvokeContract {
  'app:get-info': { args: []; result: AppInfo }
}

export type IpcChannel = keyof IpcInvokeContract
export type IpcArgs<C extends IpcChannel> = IpcInvokeContract[C]['args']
export type IpcResult<C extends IpcChannel> = IpcInvokeContract[C]['result']

/** API surface exposed on `window.soar` by the preload script. */
export interface SoarApi {
  app: {
    getInfo: () => Promise<AppInfo>
  }
}
