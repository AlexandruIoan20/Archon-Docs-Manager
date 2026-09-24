import { z } from 'zod'
import { isoDate } from './common.schema'

export const DOCUMENT_FORMAT_VERSION = '1.0.0'

export const EMPTY_TIPTAP_DOC = { type: 'doc', content: [] } as const

/** Older files stored the TipTap content as a JSON string (or plain text). */
function contentFromString(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    const text = value.trim()
    return {
      type: 'doc',
      content: text ? [{ type: 'paragraph', content: [{ type: 'text', text }] }] : []
    }
  }
}

/** TipTap JSON root. Inner nodes are kept as-is; the editor validates them (plan 12). */
export const tiptapDocSchema = z.preprocess(
  contentFromString,
  z.looseObject({
    type: z.literal('doc'),
    content: z.array(z.unknown()).default([])
  })
)

/** `.soardoc`: a rich-text document. */
export const documentFileSchema = z.object({
  version: z.string().min(1),
  id: z.string().min(1),
  title: z.string().max(200),
  created: isoDate,
  lastModified: isoDate,
  content: tiptapDocSchema.default({ ...EMPTY_TIPTAP_DOC, content: [] }),
  tags: z.array(z.string()).default([]),
  /** Ids of diagrams this document refers to. */
  linkedDiagrams: z.array(z.string()).default([])
})
