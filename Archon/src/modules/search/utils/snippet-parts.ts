import { SEARCH_MATCH_END, SEARCH_MATCH_START } from '@/core/constants/search.constants'

export interface SnippetPart {
  text: string
  match: boolean
}

/** Splits an index snippet on its match markers. The text stays text: no HTML is parsed. */
export function snippetParts(snippet: string): SnippetPart[] {
  const parts: SnippetPart[] = []
  let rest = snippet
  while (rest !== '') {
    const start = rest.indexOf(SEARCH_MATCH_START)
    if (start === -1) {
      parts.push({ text: rest, match: false })
      break
    }
    if (start > 0) parts.push({ text: rest.slice(0, start), match: false })
    const end = rest.indexOf(SEARCH_MATCH_END, start + 1)
    const stop = end === -1 ? rest.length : end
    parts.push({ text: rest.slice(start + 1, stop), match: true })
    rest = end === -1 ? '' : rest.slice(end + 1)
  }
  return parts.filter((part) => part.text !== '')
}
