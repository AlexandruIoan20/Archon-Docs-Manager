import type { SqliteDatabase } from '../db'

export interface ProjectRecord {
  id: string
  name: string
  rootPath: string
  lastOpened: string
}

export interface ProjectsRepo {
  touch: (workspace: { id: string; name: string; rootPath: string }, now?: Date) => void
  /** Most recently opened first. */
  list: () => ProjectRecord[]
}

/** Workspaces opened on this machine (app database). */
export function createProjectsRepo(db: SqliteDatabase): ProjectsRepo {
  const upsert = db.prepare(`
    INSERT INTO projects (id, name, root_path, last_opened) VALUES (@id, @name, @rootPath, @lastOpened)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, root_path = excluded.root_path, last_opened = excluded.last_opened`)
  const list = db.prepare<[], ProjectRecord>(`
    SELECT id, name, root_path AS rootPath, last_opened AS lastOpened
    FROM projects ORDER BY last_opened DESC`)

  return {
    touch: (workspace, now = new Date()) => {
      upsert.run({ ...workspace, lastOpened: now.toISOString() })
    },
    list: () => list.all()
  }
}
