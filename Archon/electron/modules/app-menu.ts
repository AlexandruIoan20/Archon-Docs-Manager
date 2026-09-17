import { Menu } from 'electron'

/**
 * Replaces Electron's default menu, whose View entries bind Ctrl/Cmd + `=`/`-`/`0`
 * to Chromium zoom. The renderer owns those shortcuts so the zoom always matches
 * the persisted setting.
 * macOS keeps a minimal menu: without the Edit roles, copy/paste shortcuts stop working.
 */
export function installAppMenu(): void {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null)
    return
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])
  )
}
