import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { IpcArgs, IpcChannel, IpcResult } from '@/core/types'

type Handler<C extends IpcChannel> = (
  event: IpcMainInvokeEvent,
  ...args: IpcArgs<C>
) => IpcResult<C> | Promise<IpcResult<C>>

/** Rejects IPC calls that do not originate from our own renderer bundle. */
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url
  if (!url) return false
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) return url.startsWith(devUrl)
  return url.startsWith('file://')
}

export function handle<C extends IpcChannel>(channel: C, handler: Handler<C>): void {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, (event, ...args: unknown[]) => {
    if (!isTrustedSender(event)) {
      throw new Error(`Blocked IPC call on "${channel}" from untrusted sender`)
    }
    // The cast is safe for the argument shape because preload only invokes through
    // the typed contract; handlers must still validate values they persist.
    return handler(event, ...(args as IpcArgs<C>))
  })
}
