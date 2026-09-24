import { app, type BrowserWindow } from 'electron'
import { send } from './ipc/typed-ipc'

/** Windows whose page has a running close guard (`app:enable-close-guard`). */
const guarded = new WeakSet<BrowserWindow>()
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
 * for real. Only a page that announced its guard is waited for: a page that
 * failed to load, is reloading or crashed could never answer, and the window
 * would stay open for good.
 */
export function guardWindowClose(window: BrowserWindow): void {
  window.on('close', (event) => {
    if (released.has(window) || !guarded.has(window)) return
    event.preventDefault()
    // If the renderer cancels, the quit is over; a later close must not quit.
    pendingQuit.set(window, quitting)
    quitting = false
    send(window, 'app:before-quit', null)
  })
  // A new page load starts without a guard until it announces one.
  window.webContents.on('did-start-loading', () => guarded.delete(window))
  window.webContents.on('render-process-gone', () => guarded.delete(window))
  window.webContents.on('unresponsive', () => guarded.delete(window))
}

/** The page's close guard is running (answer to `useQuitGuard` mounting). */
export function enableCloseGuard(window: BrowserWindow): void {
  guarded.add(window)
}

/** The renderer's answer: the window may close (and the app quit, if that was asked). */
export function confirmClose(window: BrowserWindow): void {
  released.add(window)
  if (pendingQuit.get(window)) app.quit()
  else window.close()
}
