import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  IpcArgs,
  IpcChannel,
  IpcEvent,
  IpcEventPayload,
  IpcResult,
  SoarApi
} from '@/core/types'

// Only whitelisted, typed calls are exposed. `ipcRenderer` itself never reaches
// the renderer, so page code cannot talk to arbitrary channels.
function invoke<C extends IpcChannel>(channel: C, ...args: IpcArgs<C>): Promise<IpcResult<C>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<IpcResult<C>>
}

// A `Record` over the event union forces this list to stay exhaustive; the Set
// is the runtime guard, since page code can pass any string at runtime.
const SUBSCRIBABLE_EVENTS: Record<IpcEvent, true> = {
  'window:maximized-changed': true,
  'system:theme-changed': true
}
const ALLOWED_EVENTS = new Set<string>(Object.keys(SUBSCRIBABLE_EVENTS))

function on<E extends IpcEvent>(
  event: E,
  callback: (payload: IpcEventPayload<E>) => void
): () => void {
  if (!ALLOWED_EVENTS.has(event)) {
    throw new Error(`Subscription to unknown IPC event "${String(event)}" refused`)
  }
  // The renderer only gets the payload: `IpcRendererEvent` exposes `sender`.
  const listener = (_event: IpcRendererEvent, payload: IpcEventPayload<E>): void => {
    callback(payload)
  }
  ipcRenderer.on(event, listener)
  return () => {
    ipcRenderer.removeListener(event, listener)
  }
}

const api: SoarApi = {
  app: {
    getInfo: () => invoke('app:get-info')
  },
  window: {
    minimize: () => invoke('window:minimize'),
    toggleMaximize: () => invoke('window:toggle-maximize'),
    close: () => invoke('window:close'),
    isMaximized: () => invoke('window:is-maximized'),
    setTitleBarColors: (colors) => invoke('window:set-titlebar-colors', colors),
    setZoom: (factor) => invoke('window:set-zoom', factor)
  },
  settings: {
    get: () => invoke('settings:get'),
    update: (patch) => invoke('settings:update', patch)
  },
  system: {
    getTheme: () => invoke('system:get-theme')
  },
  on
}

contextBridge.exposeInMainWorld('soar', api)
