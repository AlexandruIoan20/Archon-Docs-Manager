import { clearOwnWrites } from './file-system/own-writes'
import { startWatcher, stopWatcher, type WatchEvent } from './file-system/watcher'
import { closeWorkspace, onWorkspaceLifecycle, openWorkspace } from './file-system/workspace'
import { broadcast } from './ipc/typed-ipc'
import { getSettingsStore } from './settings'
import { pruneRecentWorkspaces, rememberWorkspace } from './settings/recent-workspaces'

type FileEventListener = (event: WatchEvent) => void

const fileEventListeners = new Set<FileEventListener>()

/** Lets other services (the index, plan 10) follow file changes on disk. */
export function onWorkspaceFileEvent(listener: FileEventListener): () => void {
  fileEventListeners.add(listener)
  return () => fileEventListeners.delete(listener)
}

/** Starts and stops the watcher with the open workspace. Call once at startup. */
export function startWorkspaceServices(): void {
  onWorkspaceLifecycle({
    opened: (workspace) =>
      startWatcher(workspace.root, {
        onTreeChanged: () => broadcast('workspace:tree-changed', null),
        onFileEvent: (event) => fileEventListeners.forEach((listener) => listener(event))
      }),
    closed: async () => {
      await stopWatcher()
      clearOwnWrites()
    }
  })
}

/** Reopens the workspace that was open at the last quit, if it still exists. */
export async function restoreLastWorkspace(): Promise<void> {
  const store = getSettingsStore()
  pruneRecentWorkspaces(store)
  const last = store.get().session.lastWorkspace
  if (!last) return
  try {
    const workspace = await openWorkspace(last)
    await rememberWorkspace(store, workspace.root)
  } catch (error) {
    console.warn('[workspace] could not reopen the last workspace', error)
    store.updateSync({ session: { lastWorkspace: null } })
  }
}

/** Closes the workspace (and its watcher) before the app quits. */
export async function shutdownWorkspaceServices(): Promise<void> {
  // Closing here must not clear `lastWorkspace`: the next launch reopens it.
  await closeWorkspace()
}
