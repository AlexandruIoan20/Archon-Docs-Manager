import { useShallow } from 'zustand/react/shallow'
import type { DiagramState } from '../store/diagram.store'
import { useDiagramStore } from '../store/DiagramStoreProvider'
import type { FlowEdge, FlowNode } from '../utils/graph-mapping'

/** What the properties panel edits. */
export type SelectedElements =
  | { kind: 'none' }
  | { kind: 'node'; node: FlowNode }
  | { kind: 'edge'; edge: FlowEdge }
  | { kind: 'multiple'; nodeIds: string[]; edgeIds: string[] }

// Ids first: they only change with the selection, so the panel does not
// re-render while an unselected node is dragged.
export const selectSelectedNodeIds = (state: DiagramState): string[] =>
  state.nodes.filter((node) => node.selected).map((node) => node.id)

export const selectSelectedEdgeIds = (state: DiagramState): string[] =>
  state.edges.filter((edge) => edge.selected).map((edge) => edge.id)

/**
 * The selection, from the `selected` flags (the ones Delete acts on): one
 * node, one edge, several elements, or none.
 */
export function useSelectedElements(): SelectedElements {
  const nodeIds = useDiagramStore(useShallow(selectSelectedNodeIds))
  const edgeIds = useDiagramStore(useShallow(selectSelectedEdgeIds))
  const single = nodeIds.length + edgeIds.length === 1
  const node = useDiagramStore((s) =>
    single && nodeIds.length === 1 ? s.nodes.find((n) => n.id === nodeIds[0]) : undefined
  )
  const edge = useDiagramStore((s) =>
    single && edgeIds.length === 1 ? s.edges.find((e) => e.id === edgeIds[0]) : undefined
  )

  if (node) return { kind: 'node', node }
  if (edge) return { kind: 'edge', edge }
  if (nodeIds.length + edgeIds.length === 0) return { kind: 'none' }
  return { kind: 'multiple', nodeIds, edgeIds }
}
