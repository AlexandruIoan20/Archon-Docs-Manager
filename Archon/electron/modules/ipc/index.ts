import { registerAppHandlers } from './app.handler'

/** Registers every IPC handler. Called once, before the first window is created. */
export function registerIpcHandlers(): void {
  registerAppHandlers()
}
