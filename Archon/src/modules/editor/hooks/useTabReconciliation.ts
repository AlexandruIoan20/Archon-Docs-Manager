import { useEffect } from 'react'
import type { FolderEntry } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { collectFilePaths } from '../utils/tree-files'

/**
 * Closes the tabs whose files disappeared from the workspace tree (deleted or
 * renamed outside the app). Renames made in the app already moved their tabs.
 */
export function useTabReconciliation(tree: FolderEntry | undefined): void {
  useEffect(() => {
    if (!tree) return
    const files = collectFilePaths(tree)
    const { tabs, close } = useEditorStore.getState()
    const gone = tabs.filter((tab) => !files.has(tab.relPath))
    if (gone.length === 0) return
    for (const tab of gone) close(tab.id)
    useUiStore
      .getState()
      .notify(
        gone.length === 1
          ? `${gone[0]?.title} was deleted`
          : `${gone.length} open files were deleted`
      )
  }, [tree])
}
