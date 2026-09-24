import type { Migration } from '../index'

/** App database: workspaces that have been opened on this machine. */
export const appMigration001Projects: Migration = {
  version: 1,
  name: 'projects',
  up: (db) => {
    db.exec(`
      CREATE TABLE projects (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        root_path   TEXT NOT NULL,
        last_opened TEXT NOT NULL
      );
      CREATE INDEX projects_last_opened ON projects(last_opened DESC);
    `)
  }
}

export const APP_MIGRATIONS: readonly Migration[] = [appMigration001Projects]
