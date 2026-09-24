import { useCallback, useEffect, useRef } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import type { EditorTabRef, SoarDocument } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { useDocumentEditorStore } from '../store/document-editor.store'
import { useAutosave } from './useAutosave'
import { useDocumentEditor, wordsOf } from './useDocumentEditor'

/** Replaces the content, keeping the cursor where it was as far as the new text allows. */
function replaceContent(editor: Editor, content: SoarDocument['content']): void {
  const { from, to } = editor.state.selection
  editor.commands.setContent(content as JSONContent, { emitUpdate: false })
  const size = editor.state.doc.content.size
  editor.commands.setTextSelection({ from: Math.min(from, size), to: Math.min(to, size) })
}

export interface DocumentController {
  editor: Editor | null
  setTitle: (title: string) => void
}

/**
 * Everything one open document needs: the editor, autosave, the session the
 * other slots read, and reloads when the file changes on disk.
 * `latest` is the version on disk as the query currently holds it.
 */
export function useDocumentController(
  tab: EditorTabRef,
  initial: SoarDocument,
  latest: SoarDocument | undefined
): DocumentController {
  const { tabId, filePath } = tab
  /** The disk version the editor content is based on. */
  const known = useRef(initial)
  const changeRef = useRef<() => void>(() => undefined)
  /** The disk version a conflict toast was already shown for. */
  const conflictShown = useRef<SoarDocument | null>(null)

  const editor = useDocumentEditor(tabId, initial, () => changeRef.current())

  const build = useCallback((): SoarDocument | null => {
    if (!editor) return null
    const session = useDocumentEditorStore.getState().sessions[tabId]
    return {
      ...known.current,
      title: session?.title ?? known.current.title,
      tags: session?.tags ?? known.current.tags,
      content: editor.getJSON() as SoarDocument['content']
    }
  }, [editor, tabId])

  // Declared before the session effect: on unmount its flush still reads the session.
  const autosave = useAutosave({
    tabId,
    relPath: filePath,
    build,
    onSaved: (saved) => {
      known.current = saved
    }
  })
  useEffect(() => {
    changeRef.current = autosave.markChanged
  })

  const { open, patch, remove } = useDocumentEditorStore.getState()
  useEffect(() => {
    const doc = known.current
    open(tabId, {
      editor: null,
      title: doc.title,
      tags: doc.tags,
      linkedDiagrams: doc.linkedDiagrams,
      words: 0,
      changed: () => changeRef.current()
    })
    return () => remove(tabId)
  }, [tabId, open, remove])

  useEffect(() => {
    if (editor) patch(tabId, { editor, words: wordsOf(editor) })
  }, [editor, tabId, patch])

  useEffect(() => {
    if (!editor || !latest || latest === known.current) return
    const reload = (): void => {
      replaceContent(editor, latest.content)
      const { title, tags, linkedDiagrams } = latest
      patch(tabId, { title, tags, linkedDiagrams, words: wordsOf(editor) })
      known.current = latest
      autosave.discard()
    }
    const dirty = useEditorStore.getState().tabs.find((t) => t.id === tabId)?.dirty
    if (!dirty) reload()
    else if (conflictShown.current !== latest) {
      conflictShown.current = latest
      const name = latest.title || filePath
      useUiStore
        .getState()
        .notify(`${name} changed on disk`, 'error', { label: 'Reload', run: reload })
    }
  }, [latest, editor, tabId, filePath, patch, autosave])

  const setTitle = useCallback(
    (title: string) => {
      patch(tabId, { title })
      autosave.markChanged()
    },
    [autosave, patch, tabId]
  )

  return { editor, setTitle }
}
