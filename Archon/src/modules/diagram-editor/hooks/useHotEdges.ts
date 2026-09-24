import { useDiagramStore } from '../store/DiagramStoreProvider'

/**
 * Whether an edge touches a selected node ("hot": accent, animated). Derived
 * from the selection, never written to the file; each edge re-renders only
 * when its own answer changes.
 */
export function useIsHotEdge(source: string, target: string): boolean {
  return useDiagramStore((s) => {
    const selected = s.selection.nodes
    return selected.includes(source) || selected.includes(target)
  })
}
