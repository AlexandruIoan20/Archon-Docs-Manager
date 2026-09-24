import { app } from 'electron'
import { rmSync } from 'fs'
import type { IndexStatus } from '@/core/types'
import { closeAll, closeDb, openAppDb, openWorkspaceDb, workspaceDbPath } from './database/db'
import type { SqliteDatabase } from './database/db'
import { createIndexer, type Indexer } from './database/indexer'
import { createProjectsRepo } from './database/repositories/projects.repo'
import { createSearchRepo, type SearchRepo } from './database/repositories/search.repo'
import { AppError } from './errors'
import { onWorkspaceLifecycle, type OpenWorkspace } from './file-system/workspace'
import { broadcast } from './ipc/typed-ipc'
import { onWorkspaceFileEvent } from './workspace-services'

interface ActiveIndex {
  workspace: OpenWorkspace
  db: SqliteDatabase
  indexer: Indexer
  search: SearchRepo
}

let active: ActiveIndex | null = null

const IDLE_STATUS: IndexStatus = { indexing: false, files: 0, skipped: 0, lastSync: null }

const logFailure = (what: string) => (error: unknown) => console.error(`[index] ${what}`, error)

function removeDbFiles(path: string): void {
  for (const suffix of ['', '-wal', '-shm']) rmSync(`${path}${suffix}`, { force: true })
}

/** The index is a cache: an unreadable file is deleted and rebuilt from the workspace. */
function openIndexDb(workspaceId: string): SqliteDatabase {
  const userData = app.getPath('userData')
  try {
    return openWorkspaceDb(userData, workspaceId)
  } catch (error) {
    console.warn('[index] index file unreadable, recreating it', error)
    removeDbFiles(workspaceDbPath(userData, workspaceId))
    return openWorkspaceDb(userData, workspaceId)
  }
}

/** Opens the index and starts a full sync; the returned promise settles when it is done. */
function attach(workspace: OpenWorkspace): Promise<unknown> {
  const db = openIndexDb(workspace.file.id)
  const indexer = createIndexer({
    db,
    root: workspace.root,
    onProgress: (progress) => broadcast('index:progress', progress)
  })
  active = { workspace, db, indexer, search: createSearchRepo(db) }
  const sync = indexer.fullSync()
  sync.catch(logFailure('sync failed'))
  return sync
}

async function detach(): Promise<void> {
  const closing = active
  active = null
  if (!closing) return
  await closing.indexer.dispose()
  closeDb(closing.db)
}

function rememberProject(workspace: OpenWorkspace): void {
  try {
    createProjectsRepo(openAppDb(app.getPath('userData'))).touch({
      id: workspace.file.id,
      name: workspace.file.name,
      rootPath: workspace.root
    })
  } catch (error) {
    logFailure('could not record the project')(error)
  }
}

function requireIndex(): ActiveIndex {
  if (!active) throw new AppError('NO_WORKSPACE', 'No workspace is open')
  return active
}

/** Opens the index with the workspace and follows external file changes. Call once at startup. */
export function startIndexService(): void {
  onWorkspaceLifecycle({
    opened: (workspace) => {
      rememberProject(workspace)
      // Not awaited: the workspace opens at once, the index catches up in the background.
      void attach(workspace)
    },
    closed: detach
  })
  onWorkspaceFileEvent((event) => {
    // The app's own writes are indexed directly by the fs handlers (`reindexPaths`).
    if (event.own || !active) return
    void active.indexer.syncPath(event.relPath).catch(logFailure(`update of ${event.relPath}`))
  })
}

/** Called after the app changed files itself; each path may be a file or a folder. */
export function reindexPaths(...relPaths: string[]): void {
  if (!active) return
  for (const relPath of relPaths) {
    void active.indexer.syncPath(relPath, true).catch(logFailure(`update of ${relPath}`))
  }
}

export function getIndexStatus(): IndexStatus {
  return active ? active.indexer.getStatus() : IDLE_STATUS
}

export function getSearchRepo(): SearchRepo {
  return requireIndex().search
}

/** Deletes the index file and indexes the workspace from scratch. */
export async function rebuildIndex(): Promise<IndexStatus> {
  const { workspace } = requireIndex()
  await detach()
  removeDbFiles(workspaceDbPath(app.getPath('userData'), workspace.file.id))
  await attach(workspace)
  return getIndexStatus()
}

export async function shutdownIndexService(): Promise<void> {
  await detach()
  closeAll()
}
