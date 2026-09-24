import { BrowserWindow, screen, shell, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { AppSettings, ResolvedTheme } from '@/core/types'
import { LAYOUT } from '@/core/constants/layout.constants'
import { guardWindowClose } from './close-guard'
import { send } from './ipc/typed-ipc'
import { systemTheme } from './ipc/settings.handler'
import { getSettingsStore } from './settings'
import { resolveInitialBounds, type InitialBounds } from './window-bounds'
import { trackWindowState } from './window-state'

const MAIN_WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 720,
  minHeight: 480
} as const

/**
 * Window chrome per theme, matching `--bg` / `--text2` in the theme CSS.
 * The renderer updates the Windows overlay itself when the theme changes.
 */
const THEME_CHROME: Record<ResolvedTheme, { color: string; symbolColor: string }> = {
  dark: { color: '#0D0F16', symbolColor: '#8892A4' },
  light: { color: '#F8FAFC', symbolColor: '#64748B' }
}

// Vertically centers the 12px traffic lights inside the 48px title bar.
const MAC_TRAFFIC_LIGHTS = { x: 14, y: 16 } as const

/**
 * The native frame is dropped everywhere; the renderer draws the title bar.
 * - Windows keeps native caption buttons as an overlay (Snap Layouts keep working).
 * - macOS keeps the traffic lights, inset into our bar.
 * - Linux draws its own controls: `titleBarOverlay` differs between window managers.
 */
function frameOptions(theme: ResolvedTheme): BrowserWindowConstructorOptions {
  switch (process.platform) {
    case 'win32':
      return {
        titleBarStyle: 'hidden',
        titleBarOverlay: { ...THEME_CHROME[theme], height: LAYOUT.titlebar }
      }
    case 'darwin':
      return { titleBarStyle: 'hiddenInset', trafficLightPosition: MAC_TRAFFIC_LIGHTS }
    default:
      return { frame: false, icon }
  }
}

function initialBounds(settings: AppSettings): InitialBounds {
  // Without saved bounds, open on the display the user is looking at.
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { width, height, minWidth, minHeight } = MAIN_WINDOW_DEFAULTS
  return resolveInitialBounds({
    workArea: display.workArea,
    displays: screen.getAllDisplays().map((d) => d.workArea),
    preferred: { width, height },
    min: { width: minWidth, height: minHeight },
    saved: settings.window.bounds
  })
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
  const store = getSettingsStore()
  const settings = store.get()
  const { theme: themePreference, uiZoom } = settings.appearance
  const theme = themePreference === 'system' ? systemTheme() : themePreference

  const window = new BrowserWindow({
    ...initialBounds(settings),
    ...frameOptions(theme),
    show: false,
    autoHideMenuBar: true,
    // Matches the saved theme so no white or black flash shows before the first paint.
    backgroundColor: THEME_CHROME[theme].color,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      zoomFactor: uiZoom
    }
  })

  window.once('ready-to-show', () => {
    if (settings.window.maximized) window.maximize()
    window.show()
  })
  // Pinch-zoom would bypass the persisted interface zoom.
  window.webContents.on('did-finish-load', () => {
    void window.webContents.setVisualZoomLevelLimits(1, 1)
  })
  hardenNavigation(window)
  forwardWindowState(window)
  guardWindowClose(window)
  trackWindowState(window, store)

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) {
    void window.loadURL(devUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
