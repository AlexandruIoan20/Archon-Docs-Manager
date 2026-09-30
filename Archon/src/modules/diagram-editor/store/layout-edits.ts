import { alignBoxes, distributeBoxes, type Moves } from '../utils/align'
import { arrange, arrangeable } from '../utils/auto-layout'
import type { FlowEdge, FlowNode } from '../utils/graph-mapping'
import { nodeRect, type Rect } from '../utils/node-rect'
import type { DiagramState, GetState, LayoutEdits, SetState } from './diagram-state'
import { edit } from './graph-edits'

const selectedBoxes = (state: DiagramState): Map<string, Rect> =>
  new Map(state.nodes.filter((node) => node.selected).map((node) => [node.id, nodeRect(node)]))

const moved = (nodes: FlowNode[], moves: Moves): FlowNode[] =>
  nodes.map((node) => {
    const position = moves.get(node.id)
    return position ? { ...node, position } : node
  })

/** Align, distribute and arrange: each one undo step, nothing when nothing moves. */
export function createLayoutEdits(set: SetState, get: GetState): LayoutEdits {
  const apply = (moves: Moves): number => {
    if (moves.size > 0) {
      const state = get()
      set(edit(state, { nodes: moved(state.nodes, moves) }))
    }
    return moves.size
  }

  return {
    fitRequest: 0,

    alignSelection: (mode) => apply(alignBoxes(selectedBoxes(get()), mode)),

    distributeSelection: (axis) => apply(distributeBoxes(selectedBoxes(get()), axis)),

    arrange: (direction) => {
      const state = get()
      // Two or more selected nodes arrange alone; otherwise the whole diagram does.
      const selected = state.nodes.filter((node) => node.selected)
      const scope = arrangeable(selected.length > 1 ? selected : state.nodes, state.edges)
      if (scope.length < 2) return false
      const { moves, handles } = arrange(scope, state.edges, direction)
      const edges = state.edges.map((edge): FlowEdge => {
        const sides = handles.get(edge.id)
        return sides ? { ...edge, ...sides } : edge
      })
      set({
        ...edit(state, { nodes: moved(state.nodes, moves), edges }),
        fitRequest: state.fitRequest + 1
      })
      return true
    }
  }
}
