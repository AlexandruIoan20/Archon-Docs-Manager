import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const MAIN_WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 960,
  minHeight: 600
} as const

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

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...MAIN_WINDOW_DEFAULTS,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0d0f16',
    ...(process.platform === 'linux' ? { icon } : {}),
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

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) {
    void window.loadURL(devUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
