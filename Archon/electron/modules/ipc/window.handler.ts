import { BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import type { TitleBarColors } from '@/core/types'
import { LAYOUT } from '@/core/constants/layout.constants'
import { handle } from './typed-ipc'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

/** Each call acts on the window that sent it, never on a window id from the payload. */
function senderWindow(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) throw new Error('IPC sender has no owning window')
  return window
}

function assertTitleBarColors(colors: TitleBarColors): void {
  if (!HEX_COLOR.test(colors?.color) || !HEX_COLOR.test(colors?.symbolColor)) {
    throw new Error('Invalid title bar colors: expected #RRGGBB values')
  }
}

export function registerWindowHandlers(): void {
  handle('window:minimize', (event) => {
    senderWindow(event).minimize()
  })

  handle('window:toggle-maximize', (event) => {
    const window = senderWindow(event)
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  })

  handle('window:close', (event) => {
    senderWindow(event).close()
  })

  handle('window:is-maximized', (event) => senderWindow(event).isMaximized())

  handle('window:set-titlebar-colors', (event, colors) => {
    assertTitleBarColors(colors)
    // Only Windows draws native controls over our bar; elsewhere this is a no-op.
    if (process.platform !== 'win32') return
    senderWindow(event).setTitleBarOverlay({ ...colors, height: LAYOUT.titlebar })
  })
}
