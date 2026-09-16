import { contextBridge, ipcRenderer } from 'electron'
import type { IpcArgs, IpcChannel, IpcResult, SoarApi } from '@/core/types'

// Only whitelisted, typed calls are exposed. `ipcRenderer` itself never reaches
// the renderer, so page code cannot talk to arbitrary channels.
function invoke<C extends IpcChannel>(channel: C, ...args: IpcArgs<C>): Promise<IpcResult<C>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<IpcResult<C>>
}

const api: SoarApi = {
  app: {
    getInfo: () => invoke('app:get-info')
  }
}

contextBridge.exposeInMainWorld('soar', api)
