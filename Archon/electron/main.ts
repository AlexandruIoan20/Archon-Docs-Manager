import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './modules/ipc'
import { installAppMenu } from './modules/app-menu'
import { createMainWindow } from './modules/window-manager'
import { shutdownIndexService, startIndexService } from './modules/index-service'
import {
  restoreLastWorkspace,
  shutdownWorkspaceServices,
  startWorkspaceServices
} from './modules/workspace-services'

const APP_USER_MODEL_ID = 'com.archon.soardocsstudio'
/** Longest the app waits for its cleanup (watcher, index) when quitting. */
const SHUTDOWN_TIMEOUT_MS = 3000

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

  void app.whenReady().then(async () => {
    electronApp.setAppUserModelId(APP_USER_MODEL_ID)

    // F12 toggles DevTools in dev; Ctrl/Cmd+R reload is disabled in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    installAppMenu()
    registerIpcHandlers()
    startWorkspaceServices()
    startIndexService()
    // Before the window: its first `workspace:get-current` already sees the workspace.
    await restoreLastWorkspace()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  // Stop the watcher and close the index before the process exits. Once
  // `will-quit` has been prevented, Electron ignores a second `app.quit()`, so
  // the process ends with `app.exit()`; a cleanup that hangs must not keep it alive.
  let shuttingDown = false
  app.on('will-quit', (event) => {
    event.preventDefault()
    if (shuttingDown) return
    shuttingDown = true
    const cleanup = shutdownWorkspaceServices().then(shutdownIndexService)
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS))
    void Promise.race([cleanup, timeout])
      .catch((error: unknown) => console.error('[main] shutdown failed', error))
      .finally(() => app.exit(0))
  })
}
