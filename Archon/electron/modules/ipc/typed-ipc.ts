import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import type {
  IpcArgs,
  IpcChannel,
  IpcEvent,
  IpcEventPayload,
  IpcResult,
  Result,
  ResultValue
} from '@/core/types'
import { toErrorPayload } from '../errors'

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

/** Channels whose answer is a `Result<T>`. */
type ResultChannel = {
  [C in IpcChannel]: IpcResult<C> extends Result<unknown> ? C : never
}[IpcChannel]

type ValueHandler<C extends ResultChannel> = (
  event: IpcMainInvokeEvent,
  ...args: IpcArgs<C>
) => ResultValue<IpcResult<C>> | Promise<ResultValue<IpcResult<C>>>

/**
 * Registers a handler that returns its value directly; thrown errors become
 * `{ ok: false, error }` instead of crossing IPC as opaque exceptions.
 */
export function handleResult<C extends ResultChannel>(channel: C, handler: ValueHandler<C>): void {
  handle(channel, (async (event: IpcMainInvokeEvent, ...args: IpcArgs<C>) => {
    try {
      return { ok: true, value: await handler(event, ...args) }
    } catch (error) {
      const payload = toErrorPayload(error)
      if (payload.code === 'IO_ERROR') console.error(`[ipc] ${channel} failed`, error)
      return { ok: false, error: payload }
    }
    // The wrapper builds exactly the `Result` shape of the channel.
  }) as unknown as Handler<C>)
}

/** Pushes an event to every open window. */
export function broadcast<E extends IpcEvent>(event: E, payload: IpcEventPayload<E>): void {
  for (const window of BrowserWindow.getAllWindows()) send(window, event, payload)
}

/** Pushes a typed event to one window's renderer. No-op once the window is gone. */
export function send<E extends IpcEvent>(
  window: BrowserWindow,
  event: E,
  payload: IpcEventPayload<E>
): void {
  if (window.isDestroyed()) return
  window.webContents.send(event, payload)
}
