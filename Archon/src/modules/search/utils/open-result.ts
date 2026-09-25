import type { SearchResult } from '@/core/types'
import { useEditorStore } from '@/store'

/**
 * Opens a result: its file, and for a diagram node the node selected and
 * centred (the diagram editor takes both over from `editor.store`).
 */
export function openSearchResult(result: SearchResult): void {
  const editor = useEditorStore.getState()
  const tabId = editor.openFile(result.relPath, result.kind)
  if (result.nodeId !== null) {
    editor.setPendingSelection(tabId, [result.nodeId])
    editor.setPendingFocus(tabId, result.nodeId)
  }
}
