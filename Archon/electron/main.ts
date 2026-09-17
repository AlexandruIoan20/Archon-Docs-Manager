import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './modules/ipc'
import { installAppMenu } from './modules/app-menu'
import { createMainWindow } from './modules/window-manager'

const APP_USER_MODEL_ID = 'com.archon.soardocsstudio'

// A second instance would fight the first one over the same workspace files.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  void app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_USER_MODEL_ID)

    // F12 toggles DevTools in dev; Ctrl/Cmd+R reload is disabled in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    installAppMenu()
    registerIpcHandlers()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
