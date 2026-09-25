import { useEffect } from 'react'
import { useNodesInitialized, useReactFlow } from '@xyflow/react'
import { useEditorStore } from '@/store'

/**
 * Centres the canvas on the node a search result asked for, once the nodes
 * are measured. Not a pan by the user: the viewport is not saved for it.
 */
export function useFocusRequest(tabId: string): void {
  const pending = useEditorStore((s) => s.pendingFocus[tabId])
  const ready = useNodesInitialized()
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (pending === undefined || !ready) return
    const nodeId = useEditorStore.getState().takePendingFocus(tabId)
    if (nodeId === null) return
    // After the canvas' own first fit, which would otherwise win.
    const frame = requestAnimationFrame(() => {
      void fitView({ nodes: [{ id: nodeId }], maxZoom: 1, padding: 0.6, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [pending, ready, tabId, fitView])
}
