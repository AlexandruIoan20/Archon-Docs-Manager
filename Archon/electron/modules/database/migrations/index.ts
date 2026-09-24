import type Sqlite from 'better-sqlite3'

type Database = Sqlite.Database

export interface Migration {
  /** Becomes `PRAGMA user_version` once applied; strictly increasing. */
  version: number
  name: string
  up: (db: Database) => void
}

/**
 * Applies every migration newer than `PRAGMA user_version`, each in its own
 * transaction together with the version bump. Returns the versions applied.
 */
export function runMigrations(db: Database, migrations: readonly Migration[]): number[] {
  const current = db.pragma('user_version', { simple: true }) as number
  const pending = [...migrations]
    .sort((a, b) => a.version - b.version)
    .filter((migration) => migration.version > current)

  for (const migration of pending) {
    db.transaction(() => {
      migration.up(db)
      // PRAGMA does not accept bound parameters; the version is an integer we own.
      db.pragma(`user_version = ${Math.trunc(migration.version)}`)
    })()
  }
  return pending.map((migration) => migration.version)
}
