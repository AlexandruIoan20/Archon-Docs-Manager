import { existsSync } from 'fs'
import { join } from 'path'
import { WORKSPACE_FILE_NAME } from '@/core/schemas/workspace.schema'
import type { SettingsStore } from './settings'

const isWorkspaceRoot = (root: string): boolean => existsSync(join(root, WORKSPACE_FILE_NAME))

/** Moves `root` to the top of the recent list and marks it for reopening. */
export async function rememberWorkspace(store: SettingsStore, root: string): Promise<void> {
  const others = store.get().recentWorkspaces.filter((path) => path !== root)
  await store.update({ recentWorkspaces: [root, ...others], session: { lastWorkspace: root } })
}

/** An explicit close: the next launch starts on the landing screen. */
export async function forgetLastWorkspace(store: SettingsStore): Promise<void> {
  await store.update({ session: { lastWorkspace: null } })
}

export async function removeRecentWorkspace(store: SettingsStore, root: string): Promise<void> {
  const { recentWorkspaces, session } = store.get()
  await store.update({
    recentWorkspaces: recentWorkspaces.filter((path) => path !== root),
    ...(session.lastWorkspace === root ? { session: { lastWorkspace: null } } : {})
  })
}

/** Drops workspaces that no longer exist. Runs once at startup, before the window. */
export function pruneRecentWorkspaces(store: SettingsStore): void {
  const { recentWorkspaces } = store.get()
  const existing = recentWorkspaces.filter(isWorkspaceRoot)
  if (existing.length !== recentWorkspaces.length) {
    store.updateSync({ recentWorkspaces: existing })
  }
}
