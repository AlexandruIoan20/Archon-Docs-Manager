import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { APP_MIGRATIONS } from './migrations/app/001_projects'
import { WORKSPACE_MIGRATIONS } from './migrations/workspace'
import { runMigrations, type Migration } from './migrations'

export type SqliteDatabase = Database.Database

/** Opens (or creates) a database with the app's pragmas and migrations. */
export function openDatabase(path: string, migrations: readonly Migration[]): SqliteDatabase {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new Database(path)
  if (path !== ':memory:') db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  runMigrations(db, migrations)
  return db
}

const open = new Map<string, SqliteDatabase>()

function cached(path: string, migrations: readonly Migration[]): SqliteDatabase {
  let db = open.get(path)
  if (!db?.open) {
    db = openDatabase(path, migrations)
    open.set(path, db)
  }
  return db
}

/** `<userData>/indexes/<workspaceId>.db`: a cache outside the workspace, safe to rebuild. */
export function workspaceDbPath(userData: string, workspaceId: string): string {
  if (!/^[\w-]+$/.test(workspaceId)) throw new Error(`Invalid workspace id: ${workspaceId}`)
  return join(userData, 'indexes', `${workspaceId}.db`)
}

export function openWorkspaceDb(userData: string, workspaceId: string): SqliteDatabase {
  return cached(workspaceDbPath(userData, workspaceId), WORKSPACE_MIGRATIONS)
}

/** `<userData>/app.db`: data that is not tied to one workspace. */
export function openAppDb(userData: string): SqliteDatabase {
  return cached(join(userData, 'app.db'), APP_MIGRATIONS)
}

export function closeDb(db: SqliteDatabase): void {
  for (const [path, candidate] of open) {
    if (candidate === db) open.delete(path)
  }
  if (db.open) db.close()
}

export function closeAll(): void {
  for (const db of open.values()) {
    if (db.open) db.close()
  }
  open.clear()
}
