import type { SearchResult } from '@/core/types'

export type ResultGroupId = 'files' | 'nodes' | 'content'

export interface ResultGroup {
  id: ResultGroupId
  label: string
  results: SearchResult[]
}

const LABELS: Record<ResultGroupId, string> = {
  files: 'Files',
  nodes: 'Nodes',
  content: 'Content'
}

const words = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []

/** Every query word starts a word of the title (the index matches by prefix too). */
export function titleMatches(title: string, query: string): boolean {
  const titleWords = words(title)
  const queryWords = words(query)
  return queryWords.length > 0 && queryWords.every((q) => titleWords.some((t) => t.startsWith(q)))
}

/**
 * Index results as the palette shows them: diagram nodes; files whose title
 * matches; files matched in their content. Best first within each group.
 */
export function groupResults(results: readonly SearchResult[], query: string): ResultGroup[] {
  const by: Record<ResultGroupId, SearchResult[]> = { files: [], nodes: [], content: [] }
  for (const result of results) {
    if (result.nodeId !== null) by.nodes.push(result)
    else if (titleMatches(result.fileTitle, query)) by.files.push(result)
    else by.content.push(result)
  }
  return (['files', 'nodes', 'content'] as const)
    .map((id) => ({ id, label: LABELS[id], results: by[id] }))
    .filter((group) => group.results.length > 0)
}
