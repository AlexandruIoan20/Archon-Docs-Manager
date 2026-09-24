import { app, type BrowserWindow } from 'electron'
import { send } from './ipc/typed-ipc'

/** Windows the renderer has released; their next `close` goes through. */
const released = new WeakSet<BrowserWindow>()
/** Whether the held `close` was part of a quit. */
const pendingQuit = new WeakMap<BrowserWindow, boolean>()
let quitting = false

app.on('before-quit', () => {
  quitting = true
})

/**
 * Lets the renderer save or ask about unsaved changes before the window closes:
 * the first `close` is held and `app:before-quit` sent; `confirmClose` closes
 * for real. A renderer that is gone or still loading cannot answer, so its
 * window closes at once.
 */
export function guardWindowClose(window: BrowserWindow): void {
  window.on('close', (event) => {
    if (released.has(window)) return
    const contents = window.webContents
    if (contents.isCrashed() || contents.isLoading()) return
    event.preventDefault()
    // If the renderer cancels, the quit is over; a later close must not quit.
    pendingQuit.set(window, quitting)
    quitting = false
    send(window, 'app:before-quit', null)
  })
  window.webContents.on('render-process-gone', () => released.add(window))
}

/** The renderer's answer: the window may close (and the app quit, if that was asked). */
export function confirmClose(window: BrowserWindow): void {
  released.add(window)
  if (pendingQuit.get(window)) app.quit()
  else window.close()
}
