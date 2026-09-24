import type { SearchResult, TagCount } from '@/core/types'
import {
  SEARCH_DEFAULT_LIMIT,
  SEARCH_MATCH_END,
  SEARCH_MATCH_START,
  SEARCH_MAX_LIMIT
} from '@/core/constants/search.constants'
import type { SqliteDatabase } from '../db'

/**
 * User text → FTS5 query: every word must match, as a prefix (`isolate` finds
 * „Isolates”). Words are quoted, so FTS5 operators typed by the user stay text.
 */
export function toFtsQuery(text: string): string | null {
  const words = text.match(/[\p{L}\p{N}_]+/gu)
  if (!words) return null
  return words
    .slice(0, 16)
    .map((word) => `"${word}"*`)
    .join(' ')
}

export function clampLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return SEARCH_DEFAULT_LIMIT
  return Math.min(SEARCH_MAX_LIMIT, Math.max(1, Math.trunc(limit)))
}

export interface SearchRepo {
  /** Files and diagram nodes matching every word of `text`, best first. */
  query: (text: string, limit?: number) => SearchResult[]
  /** Every tag in the workspace (files and nodes), most used first. */
  listTags: () => TagCount[]
}

export function createSearchRepo(db: SqliteDatabase): SearchRepo {
  // Columns: 0 file_id, 1 node_id (unindexed), 2 title, 3 body. Title matches weigh more.
  const search = db.prepare<[string, string, string, number], SearchResult>(`
    SELECT s.file_id AS fileId, f.rel_path AS relPath, f.kind, f.title AS fileTitle,
           s.node_id AS nodeId, n.label AS nodeLabel,
           snippet(search_fts, -1, ?, ?, '…', 12) AS snippet,
           bm25(search_fts, 0, 0, 5, 1) AS score
    FROM search_fts s
    JOIN files f ON f.id = s.file_id
    LEFT JOIN diagram_nodes n ON n.file_id = s.file_id AND n.node_id = s.node_id
    WHERE search_fts MATCH ?
    ORDER BY score
    LIMIT ?`)
  const tags = db.prepare<[], TagCount>(`
    SELECT tag, COUNT(*) AS count
    FROM (SELECT tag FROM file_tags UNION ALL SELECT tag FROM node_tags)
    GROUP BY tag ORDER BY count DESC, tag COLLATE NOCASE`)

  return {
    query: (text, limit) => {
      const match = toFtsQuery(text)
      if (!match) return []
      return search.all(SEARCH_MATCH_START, SEARCH_MATCH_END, match, clampLimit(limit))
    },
    listTags: () => tags.all()
  }
}
