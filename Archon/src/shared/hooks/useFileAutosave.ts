import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerSaveHandler } from '@/core/editor/save-registry'
import { useEditorStore, useUiStore } from '@/store'
import { useDebouncedCallback } from './useDebounce'

export const AUTOSAVE_DELAY_MS = 800

export interface FileAutosaveOptions<T> {
  tabId: string
  /** The file's query; a successful save writes the saved version into it. */
  queryKey: readonly unknown[]
  /** Writes the file; resolves to the version now on disk. */
  write: (data: T) => Promise<T>
  /** The content as it should be written now; `null` while there is nothing to save. */
  build: () => T | null
  /** The version now on disk (as cached), after every successful save. */
  onSaved: (saved: T) => void
}

export interface FileAutosave {
  /** Marks the tab dirty and saves after `AUTOSAVE_DELAY_MS` without changes. */
  markChanged: () => void
  /** Saves at once; resolves to whether the file is on disk. */
  saveNow: () => Promise<boolean>
  /** Forgets unsaved changes (the content was replaced from disk). */
  discard: () => void
}

/**
 * Autosave for the file of one editor tab: debounced after each change, at
 * once on `Ctrl/Cmd+S`, on the tab guard's request and when the editor unmounts.
 */
export function useFileAutosave<T>({
  tabId,
  queryKey,
  write,
  build,
  onSaved
}: FileAutosaveOptions<T>): FileAutosave {
  const queryClient = useQueryClient()
  const setDirty = useEditorStore((s) => s.setDirty)
  /** Bumped by every change: a save only cleans the tab if nothing changed meanwhile. */
  const revision = useRef(0)

  const { mutateAsync } = useMutation({
    mutationFn: write,
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved)
      // Structural sharing may keep the old object: report what the cache holds.
      onSaved(queryClient.getQueryData<T>(queryKey) ?? saved)
    }
  })

  const saveNow = useCallback(async (): Promise<boolean> => {
    const data = build()
    if (data === null) return false
    const started = revision.current
    try {
      await mutateAsync(data)
      if (revision.current === started) setDirty(tabId, false)
      return true
    } catch (error) {
      useUiStore.getState().notify(`Could not save: ${(error as Error).message}`, 'error')
      return false
    }
  }, [build, mutateAsync, setDirty, tabId])

  // Closing the tab right after an edit must not lose it.
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
