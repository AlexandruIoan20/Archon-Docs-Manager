import type { FileKind } from './editor.types'

export interface IndexStatus {
  indexing: boolean
  /** Files currently in the index. */
  files: number
  /** Files skipped at the last sync because they could not be read. */
  skipped: number
  /** ISO time of the last completed full sync, or `null`. */
  lastSync: string | null
}

export interface IndexProgress {
  state: 'indexing' | 'idle'
  done: number
  total: number
}

/**
 * One full-text match: a file (`nodeId` null) or a diagram node.
 * `snippet` marks matches with `SEARCH_MATCH_START` / `SEARCH_MATCH_END`.
 */
export interface SearchResult {
  fileId: string
  relPath: string
  kind: FileKind
  fileTitle: string
  nodeId: string | null
  nodeLabel: string | null
  snippet: string
  /** bm25 rank; lower is better. */
  score: number
}

export interface TagCount {
  tag: string
  count: number
}
