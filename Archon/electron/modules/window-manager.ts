import { BrowserWindow, screen, shell, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { LAYOUT } from '@/core/constants/layout.constants'
import { send } from './ipc/typed-ipc'
import { resolveInitialBounds } from './window-bounds'

const MAIN_WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 720,
  minHeight: 480
} as const

// Dark theme `--bg` / `--text2`. Plan 05 updates them when the theme changes.
const WINDOWS_TITLEBAR_OVERLAY = { color: '#0D0F16', symbolColor: '#8892A4' } as const

// Vertically centers the 12px traffic lights inside the 48px title bar.
const MAC_TRAFFIC_LIGHTS = { x: 14, y: 16 } as const

/**
 * The native frame is dropped everywhere; the renderer draws the title bar.
 * - Windows keeps native caption buttons as an overlay (Snap Layouts keep working).
 * - macOS keeps the traffic lights, inset into our bar.
 * - Linux draws its own controls: `titleBarOverlay` differs between window managers.
 */
function frameOptions(): BrowserWindowConstructorOptions {
  switch (process.platform) {
    case 'win32':
      return {
        titleBarStyle: 'hidden',
        titleBarOverlay: { ...WINDOWS_TITLEBAR_OVERLAY, height: LAYOUT.titlebar }
      }
    case 'darwin':
      return { titleBarStyle: 'hiddenInset', trafficLightPosition: MAC_TRAFFIC_LIGHTS }
    default:
      return { frame: false, icon }
  }
}

function initialBounds(): ReturnType<typeof resolveInitialBounds> {
  // Open on the display the user is looking at, i.e. the one under the cursor.
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { width, height, minWidth, minHeight } = MAIN_WINDOW_DEFAULTS
  return resolveInitialBounds(
    display.workArea,
    { width, height },
    { width: minWidth, height: minHeight }
  )
}

function isExternalHttpUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://')
}

function hardenNavigation(window: BrowserWindow): void {
  // Links never open new Electron windows; web URLs go to the system browser.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  // The renderer must never navigate away from the app bundle.
  window.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (is.dev && devUrl && url.startsWith(devUrl)) return
    event.preventDefault()
    if (isExternalHttpUrl(url)) void shell.openExternal(url)
  })
}

function forwardWindowState(window: BrowserWindow): void {
  window.on('maximize', () => send(window, 'window:maximized-changed', true))
  window.on('unmaximize', () => send(window, 'window:maximized-changed', false))
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...initialBounds(),
    ...frameOptions(),
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d0f16',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  window.once('ready-to-show', () => window.show())
  hardenNavigation(window)
  forwardWindowState(window)

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) {
    void window.loadURL(devUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
