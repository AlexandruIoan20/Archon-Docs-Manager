import type { SoarDiagram } from '@/core/types'
import type { SqliteDatabase } from '../db'
import { createFileRows, type FileRecord, type FileStat } from './file-rows'

export interface DiagramNodeRecord {
  nodeId: string
  nodeType: string | null
  label: string | null
  subtitle: string | null
  description: string | null
}

export interface DiagramsRepo {
  /** Replaces the diagram, its nodes and their search rows. Returns the id used in the index. */
  upsert: (relPath: string, diagram: SoarDiagram, stat: FileStat) => string
  remove: (relPath: string) => number
  getByPath: (relPath: string) => FileRecord | undefined
  listNodes: (fileId: string) => DiagramNodeRecord[]
}

/** Index rows of `.ardiag` files: metadata, tags, nodes and their search text. */
export function createDiagramsRepo(db: SqliteDatabase): DiagramsRepo {
  const rows = createFileRows(db)
  const insertNode = db.prepare(`INSERT OR REPLACE INTO diagram_nodes
    (file_id, node_id, node_type, label, subtitle, description) VALUES (?, ?, ?, ?, ?, ?)`)
  const insertNodeTag = db.prepare(
    'INSERT OR IGNORE INTO node_tags (file_id, node_id, tag) VALUES (?, ?, ?)'
  )
  const nodesOf = db.prepare<[string], DiagramNodeRecord>(`
    SELECT node_id AS nodeId, node_type AS nodeType, label, subtitle, description
    FROM diagram_nodes WHERE file_id = ? ORDER BY rowid`)

  const upsert = db.transaction((relPath: string, diagram: SoarDiagram, stat: FileStat): string => {
    const id = rows.insert({
      id: diagram.id,
      relPath,
      kind: 'ardiag',
      title: diagram.title,
      diagramType: diagram.type,
      created: diagram.created,
      modified: diagram.lastModified,
      stat,
      tags: diagram.tags,
      body: diagram.mermaidSource ?? ''
    })

    for (const node of diagram.data.nodes) {
      const { label, subtitle, description } = node.data
      const tags = rows.unique(node.data.tags)
      insertNode.run(id, node.id, node.type, label, subtitle, description)
      for (const tag of tags) insertNodeTag.run(id, node.id, tag)
      const body = [subtitle, description, ...tags].filter(Boolean).join('\n')
      rows.insertFts(id, node.id, label, body)
    }
    return id
  })

  return {
    upsert: (relPath, diagram, stat) => upsert(relPath, diagram, stat),
    remove: (relPath) => rows.removeUnder(relPath),
    getByPath: rows.getByPath,
    listNodes: (fileId) => nodesOf.all(fileId)
  }
}
