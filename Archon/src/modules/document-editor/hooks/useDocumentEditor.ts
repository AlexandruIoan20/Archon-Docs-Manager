import { useEffect, useRef } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'
import { useEditor } from '@tiptap/react'
import type { ArchonDocument } from '@/core/types'
import { DOCUMENT_EXTENSIONS } from '../components/extensions'
import { useDocumentEditorStore } from '../store/document-editor.store'
import { countWords } from '../utils/word-count'

export const wordsOf = (editor: Editor): number =>
  countWords(editor.getText({ blockSeparator: '\n' }))

/** Ctrl/Cmd+click on a link opens it; main hands web URLs to the system browser. */
function openLinkOnModClick(_view: EditorView, _pos: number, event: MouseEvent): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null
  const href = link?.getAttribute('href')
  if (!href) return false
  window.open(href, '_blank', 'noopener')
  return true
}

/**
 * The TipTap editor of one document tab. TipTap owns the content while it is
 * edited; `onChange` fires on every edit (dirty + autosave).
 */
export function useDocumentEditor(
  tabId: string,
  initial: ArchonDocument,
  onChange: () => void
): Editor | null {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  return useEditor(
    {
      extensions: DOCUMENT_EXTENSIONS,
      // The schema checked it is a TipTap doc; its nodes are TipTap's to validate.
      content: initial.content as JSONContent,
      // Toolbar and status bar subscribe to what they need; the body never re-renders.
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: { class: 'doc-prose', 'aria-label': 'Document body', spellcheck: 'true' },
        handleClick: openLinkOnModClick
      },
      onUpdate: ({ editor }) => {
        useDocumentEditorStore.getState().patch(tabId, { words: wordsOf(editor) })
        onChangeRef.current()
      }
    },
    [tabId]
  )
}
