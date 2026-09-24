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
  'system:theme-changed': true,
  'workspace:tree-changed': true,
  'index:progress': true,
  'app:before-quit': true
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
    getInfo: () => invoke('app:get-info'),
    confirmClose: () => invoke('app:confirm-close')
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
  workspace: {
    create: (name) => invoke('workspace:create', name),
    openDialog: () => invoke('workspace:open-dialog'),
    openRecent: (rootPath) => invoke('workspace:open-recent', rootPath),
    close: () => invoke('workspace:close'),
    getCurrent: () => invoke('workspace:get-current'),
    updateSettings: (patch) => invoke('workspace:update-settings', patch),
    readTree: () => invoke('workspace:read-tree'),
    reveal: (relPath) => invoke('workspace:reveal', relPath)
  },
  fs: {
    createDocument: (folderRel, title) => invoke('fs:create-document', folderRel, title),
    createDiagram: (folderRel, options) => invoke('fs:create-diagram', folderRel, options),
    createFolder: (parentRel, name) => invoke('fs:create-folder', parentRel, name),
    readDocument: (relPath) => invoke('fs:read-document', relPath),
    writeDocument: (relPath, document) => invoke('fs:write-document', relPath, document),
    readDiagram: (relPath) => invoke('fs:read-diagram', relPath),
    writeDiagram: (relPath, diagram) => invoke('fs:write-diagram', relPath, diagram),
    rename: (relPath, newName) => invoke('fs:rename', relPath, newName),
    move: (relPath, targetFolderRel) => invoke('fs:move', relPath, targetFolderRel),
    delete: (relPath) => invoke('fs:delete', relPath)
  },
  index: {
    getStatus: () => invoke('index:get-status'),
    rebuild: () => invoke('index:rebuild'),
    listTags: () => invoke('index:list-tags')
  },
  search: {
    query: (text, limit) => invoke('search:query', text, limit)
  },
  on
}

contextBridge.exposeInMainWorld('soar', api)
