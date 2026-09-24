const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'listItem',
  'taskItem',
  'tableCell',
  'tableHeader',
  'horizontalRule'
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Plain text from TipTap JSON, for the search index. Blocks end with a line
 * break so words from neighbouring paragraphs never merge; unknown node types
 * are walked the same way, so custom extensions still contribute their text.
 */
export function extractText(node: unknown): string {
  const parts: string[] = []

  const walk = (current: unknown, depth: number): void => {
    // Deeply nested input is either broken or hostile; stop instead of overflowing.
    if (!isRecord(current) || depth > 200) return
    if (current.type === 'text' && typeof current.text === 'string') parts.push(current.text)
    if (current.type === 'hardBreak') parts.push('\n')
    if (Array.isArray(current.content)) {
      for (const child of current.content) walk(child, depth + 1)
    }
    if (typeof current.type === 'string' && BLOCK_TYPES.has(current.type)) parts.push('\n')
  }

  walk(node, 0)
  return parts
    .join('')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}
