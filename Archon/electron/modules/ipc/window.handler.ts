import { BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import type { TitleBarColors } from '@/core/types'
import { LAYOUT } from '@/core/constants/layout.constants'
import { UI_ZOOM_STEPS } from '@/core/constants/app.constants'
import { handle } from './typed-ipc'

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const ZOOM_RANGE = { min: Math.min(...UI_ZOOM_STEPS), max: Math.max(...UI_ZOOM_STEPS) }

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

function assertZoomFactor(factor: number): void {
  if (typeof factor !== 'number' || !(factor >= ZOOM_RANGE.min && factor <= ZOOM_RANGE.max)) {
    throw new Error(`Invalid zoom factor: expected ${ZOOM_RANGE.min}–${ZOOM_RANGE.max}`)
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

  handle('window:set-zoom', (event, factor) => {
    assertZoomFactor(factor)
    senderWindow(event).webContents.setZoomFactor(factor)
  })
}
