import type { SoarDocument } from '@/core/types'
import type { SqliteDatabase } from '../db'
import { extractText } from '../text-extract'
import { createFileRows, type FileRecord, type FileStat } from './file-rows'

export interface DocumentsRepo {
  /** Replaces everything indexed for `relPath`. Returns the file id used in the index. */
  upsert: (relPath: string, doc: SoarDocument, stat: FileStat) => string
  remove: (relPath: string) => number
  getByPath: (relPath: string) => FileRecord | undefined
  listByTag: (tag: string) => FileRecord[]
}

/** Index rows of `.ardoc` files: metadata, tags, diagram links and search text. */
export function createDocumentsRepo(db: SqliteDatabase): DocumentsRepo {
  const rows = createFileRows(db)
  const insertLink = db.prepare(
    'INSERT OR IGNORE INTO doc_links (doc_id, diagram_id) VALUES (?, ?)'
  )
  const byTag = db.prepare<[string], FileRecord>(`
    SELECT f.id, f.rel_path AS relPath, f.kind, f.title, f.diagram_type AS diagramType,
           f.created, f.modified, f.mtime_ms AS mtimeMs, f.size
    FROM files f JOIN file_tags t ON t.file_id = f.id
    WHERE t.tag = ? AND f.kind = 'ardoc'
    ORDER BY f.title COLLATE NOCASE`)

  const upsert = db.transaction((relPath: string, doc: SoarDocument, stat: FileStat): string => {
    const id = rows.insert({
      id: doc.id,
      relPath,
      kind: 'ardoc',
      title: doc.title,
      created: doc.created,
      modified: doc.lastModified,
      stat,
      tags: doc.tags,
      body: extractText(doc.content)
    })
    for (const diagramId of rows.unique(doc.linkedDiagrams)) insertLink.run(id, diagramId)
    return id
  })

  return {
    upsert: (relPath, doc, stat) => upsert(relPath, doc, stat),
    remove: (relPath) => rows.removeUnder(relPath),
    getByPath: rows.getByPath,
    listByTag: (tag) => byTag.all(tag.trim())
  }
}
