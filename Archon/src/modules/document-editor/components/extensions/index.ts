import type { Extensions } from '@tiptap/core'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { StarterKit } from '@tiptap/starter-kit'

export const DOCUMENT_PLACEHOLDER = 'Start writing…'

/**
 * The document schema, configured once. What these extensions produce is what
 * `.soardoc` stores as TipTap JSON.
 */
export const DOCUMENT_EXTENSIONS: Extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    // Configured below on its own, with the app's rules.
    link: false
  }),
  // Clicking edits; Ctrl/Cmd+click opens (see `useDocumentEditor`), in the browser via main.
  Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
  Placeholder.configure({ placeholder: DOCUMENT_PLACEHOLDER }),
  Typography
]
