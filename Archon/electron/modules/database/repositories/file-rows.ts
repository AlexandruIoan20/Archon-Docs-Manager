import type { FileKind } from '@/core/types'
import type { SqliteDatabase } from '../db'

export interface FileStat {
  mtimeMs: number
  size: number
}

export interface FileRecord {
  id: string
  relPath: string
  kind: FileKind
  title: string
  diagramType: string | null
  created: string | null
  modified: string | null
  mtimeMs: number
  size: number
}

export interface FileRowInput {
  /** The id stored in the file. */
  id: string
  relPath: string
  kind: FileKind
  title: string
  diagramType?: string | null
  created: string
  modified: string
  stat: FileStat
  tags: readonly string[]
  /** Searchable text of the file itself (not its nodes). */
  body: string
}

const RECORD_COLUMNS = `id, rel_path AS relPath, kind, title, diagram_type AS diagramType,
  created, modified, mtime_ms AS mtimeMs, size`

const unique = (items: readonly string[]): string[] => [
  ...new Set(items.map((item) => item.trim()).filter(Boolean))
]

export interface FileRows {
  getByPath: (relPath: string) => FileRecord | undefined
  listStats: () => { relPath: string; mtimeMs: number; size: number }[]
  /** Deletes the file at `relPath` (or everything under it) with its dependent rows. */
  removeUnder: (relPath: string) => number
  /**
   * Replaces the file row. Returns the id used: a copied file that repeats an
   * id already indexed for another path gets a path-qualified id instead.
   */
  insert: (input: FileRowInput) => string
  insertFts: (fileId: string, nodeId: string | null, title: string, body: string) => void
  unique: (items: readonly string[]) => string[]
}

/** Statements shared by the document and diagram repositories. */
export function createFileRows(db: SqliteDatabase): FileRows {
  const idOwner = db.prepare<[string], { relPath: string }>(
    'SELECT rel_path AS relPath FROM files WHERE id = ?'
  )
  const byPath = db.prepare<[string], FileRecord>(
    `SELECT ${RECORD_COLUMNS} FROM files WHERE rel_path = ?`
  )
  const insertFile = db.prepare(`INSERT INTO files
    (id, rel_path, kind, title, diagram_type, created, modified, mtime_ms, size)
    VALUES (@id, @relPath, @kind, @title, @diagramType, @created, @modified, @mtimeMs, @size)`)
  const insertTag = db.prepare('INSERT OR IGNORE INTO file_tags (file_id, tag) VALUES (?, ?)')
  const insertFts = db.prepare(
    'INSERT INTO search_fts (file_id, node_id, title, body) VALUES (?, ?, ?, ?)'
  )
  const idsUnder = db.prepare<[string, string], { id: string }>(
    "SELECT id FROM files WHERE rel_path = ? OR rel_path LIKE ? ESCAPE '\\'"
  )
  const deleteFts = db.prepare('DELETE FROM search_fts WHERE file_id = ?')
  const deleteFile = db.prepare('DELETE FROM files WHERE id = ?')
  const listStats = db.prepare<[], { relPath: string; mtimeMs: number; size: number }>(
    'SELECT rel_path AS relPath, mtime_ms AS mtimeMs, size FROM files'
  )

  const removeIds = (ids: readonly string[]): number => {
    for (const id of ids) {
      deleteFts.run(id)
      deleteFile.run(id)
    }
    return ids.length
  }

  const likePrefix = (prefix: string): string => `${prefix.replace(/[\\%_]/g, '\\$&')}/%`

  return {
    getByPath: (relPath: string): FileRecord | undefined => byPath.get(relPath),

    listStats: () => listStats.all(),

    removeUnder: (relPath: string): number =>
      removeIds(idsUnder.all(relPath, likePrefix(relPath)).map((row) => row.id)),

    insert: (input: FileRowInput): string => {
      removeIds(idsUnder.all(input.relPath, likePrefix(input.relPath)).map((row) => row.id))
      const owner = idOwner.get(input.id)
      const id =
        owner && owner.relPath !== input.relPath ? `${input.id}@${input.relPath}` : input.id
      insertFile.run({
        id,
        relPath: input.relPath,
        kind: input.kind,
        title: input.title,
        diagramType: input.diagramType ?? null,
        created: input.created,
        modified: input.modified,
        mtimeMs: Math.floor(input.stat.mtimeMs),
        size: input.stat.size
      })
      const tags = unique(input.tags)
      for (const tag of tags) insertTag.run(id, tag)
      insertFts.run(id, null, input.title, [input.body, ...tags].filter(Boolean).join('\n'))
      return id
    },

    insertFts: (fileId: string, nodeId: string | null, title: string, body: string): void => {
      insertFts.run(fileId, nodeId, title, body)
    },

    unique
  }
}
