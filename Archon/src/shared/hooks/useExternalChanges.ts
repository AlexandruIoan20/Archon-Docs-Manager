import { useEffect, useEffectEvent, useRef } from 'react'
import { useEditorStore, useUiStore } from '@/store'

export interface ExternalChangesOptions<T> {
  tabId: string
  /** The version on disk, as the file query currently holds it. */
  latest: T | undefined
  /** The disk version the editor content is based on. */
  getBase: () => T | undefined
  /** Replaces the editor content with `version`; it becomes the new base. */
  apply: (version: T) => void
  /** Shown in the conflict toast. */
  name: (version: T) => string
  /** False until the editor can take new content. */
  ready?: boolean
}

/**
 * Follows changes made to the file outside the app: a clean tab reloads at
 * once; a dirty one gets a conflict toast with „Reload”, shown once per version.
 */
export function useExternalChanges<T>({
  tabId,
  latest,
  getBase,
  apply,
  name,
  ready = true
}: ExternalChangesOptions<T>): void {
  const conflictShown = useRef<T | null>(null)

  const onVersion = useEffectEvent((version: T) => {
    if (version === getBase()) return
    const dirty = useEditorStore.getState().tabs.find((tab) => tab.id === tabId)?.dirty
    if (!dirty) {
      apply(version)
    } else if (conflictShown.current !== version) {
      conflictShown.current = version
      useUiStore.getState().notify(`${name(version)} changed on disk`, 'error', {
        label: 'Reload',
        run: () => apply(version)
      })
    }
  })

  useEffect(() => {
    if (ready && latest !== undefined) onVersion(latest)
  }, [ready, latest])
}
