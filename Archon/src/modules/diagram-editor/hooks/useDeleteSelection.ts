import { useCallback } from 'react'
import { useUiStore } from '@/store'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { formatShortcut } from '@/shared/utils/platform'
import type { DiagramStoreApi } from '../store/diagram.store'

function deletedMessage(nodes: number, edges: number): string {
  if (nodes > 1) return `${nodes} nodes deleted`
  if (nodes === 1) return 'Node deleted'
  return edges > 1 ? `${edges} edges deleted` : 'Edge deleted'
}

/** Deletes the selection with the undo toast: the Delete key and the panel's button. */
export function useDeleteSelection(store: DiagramStoreApi | null): () => void {
  const platform = usePlatform()
  return useCallback(() => {
    if (!store) return
    const { nodes, edges } = store.getState().deleteSelection()
    if (nodes + edges === 0) return
    useUiStore
      .getState()
      .notify(`${deletedMessage(nodes, edges)} — ${formatShortcut(platform, 'Z')} to undo`)
  }, [store, platform])
}
