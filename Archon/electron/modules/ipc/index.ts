import { registerAppHandlers } from './app.handler'
import { registerDbHandlers } from './db.handler'
import { registerExportHandlers } from './export.handler'
import { registerFsHandlers } from './fs.handler'
import { registerSettingsHandlers } from './settings.handler'
import { registerWindowHandlers } from './window.handler'
import { registerWorkspaceHandlers } from './workspace.handler'

/** Registers every IPC handler. Called once, before the first window is created. */
export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerWindowHandlers()
  registerSettingsHandlers()
  registerWorkspaceHandlers()
  registerFsHandlers()
  registerDbHandlers()
  registerExportHandlers()
}
