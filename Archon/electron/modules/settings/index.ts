import { app } from 'electron'
import { join } from 'path'
import { SettingsStore } from './settings'

let store: SettingsStore | null = null

/** The app-wide settings store (`userData/settings.json`). Needs `app` to be ready. */
export function getSettingsStore(): SettingsStore {
  store ??= new SettingsStore(join(app.getPath('userData'), 'settings.json'))
  return store
}

export { SettingsStore }
