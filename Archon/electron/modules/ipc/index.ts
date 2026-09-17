import { registerAppHandlers } from './app.handler'
import { registerSettingsHandlers } from './settings.handler'
import { registerWindowHandlers } from './window.handler'

/** Registers every IPC handler. Called once, before the first window is created. */
export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerWindowHandlers()
  registerSettingsHandlers()
}
