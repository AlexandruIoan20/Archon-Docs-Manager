import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SoarDocument } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { registerSaveHandler } from '@/core/editor/save-registry'
import { useEditorStore, useUiStore } from '@/store'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'
import { documentQueryKey } from './useDocumentFile'

export const AUTOSAVE_DELAY_MS = 800

export interface AutosaveOptions {
  tabId: string
  relPath: string
  /** The document as it should be written now; `null` while there is nothing to save. */
  build: () => SoarDocument | null
  /** The version now on disk (as cached), after every successful save. */
  onSaved: (saved: SoarDocument) => void
}

export interface Autosave {
  /** Marks the tab dirty and saves after `AUTOSAVE_DELAY_MS` without changes. */
  markChanged: () => void
  /** Saves at once; resolves to whether the document is on disk. */
  saveNow: () => Promise<boolean>
  /** Forgets unsaved changes (the content was replaced from disk). */
  discard: () => void
}

/**
 * Autosave for one document tab: debounced after each change, at once on
 * `Ctrl/Cmd+S`, on the tab guard's request and when the editor unmounts.
 */
export function useAutosave({ tabId, relPath, build, onSaved }: AutosaveOptions): Autosave {
  const queryClient = useQueryClient()
  const setDirty = useEditorStore((s) => s.setDirty)
  /** Bumped by every change: a save only cleans the tab if nothing changed meanwhile. */
  const revision = useRef(0)

  const { mutateAsync } = useMutation({
    mutationFn: (document: SoarDocument) => ipcClient.fs.writeDocument(relPath, document),
    onSuccess: (saved) => {
      const key = documentQueryKey(relPath)
      queryClient.setQueryData(key, saved)
      // Structural sharing may keep the old object: report what the cache holds.
      onSaved(queryClient.getQueryData<SoarDocument>(key) ?? saved)
    }
  })

  const saveNow = useCallback(async (): Promise<boolean> => {
    const document = build()
    if (!document) return false
    const started = revision.current
    try {
      await mutateAsync(document)
      if (revision.current === started) setDirty(tabId, false)
      return true
    } catch (error) {
      useUiStore.getState().notify(`Could not save: ${(error as Error).message}`, 'error')
      return false
    }
  }, [build, mutateAsync, setDirty, tabId])

  // Closing the tab right after typing must not lose the last keystrokes.
  const debounced = useDebouncedCallback(() => void saveNow(), AUTOSAVE_DELAY_MS, {
    onUnmount: 'flush'
  })

  const markChanged = useCallback(() => {
    revision.current++
    setDirty(tabId, true)
    debounced()
  }, [debounced, setDirty, tabId])

  const discard = useCallback(() => {
    debounced.cancel()
    revision.current++
    setDirty(tabId, false)
  }, [debounced, setDirty, tabId])

  const saveImmediately = useCallback(() => {
    debounced.cancel()
    return saveNow()
  }, [debounced, saveNow])

  useEffect(() => registerSaveHandler(tabId, saveImmediately), [tabId, saveImmediately])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const mod = event.ctrlKey || event.metaKey
      if (!mod || event.shiftKey || event.altKey || event.code !== 'KeyS') return
      event.preventDefault()
      void saveImmediately()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveImmediately])

  return useMemo(
    () => ({ markChanged, saveNow: saveImmediately, discard }),
    [markChanged, saveImmediately, discard]
  )
}
