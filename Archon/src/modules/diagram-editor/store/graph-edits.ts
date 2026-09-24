import type { FlowEdge, FlowNode } from '../utils/graph-mapping'
import { createEdge, createNode, isFreeForm } from '../utils/node-factory'
import type { DiagramState, GetState, GraphEdits, GraphSnapshot, SetState } from './diagram-state'
import { createHistory } from './history'

export const HISTORY_LIMIT = 30
export const history = createHistory<GraphSnapshot>(HISTORY_LIMIT)

const snap = ({ nodes, edges }: DiagramState): GraphSnapshot => ({ nodes, edges })

const deselected = <T extends { selected?: boolean }>(items: T[]): T[] =>
  items.map((item) => (item.selected ? { ...item, selected: false } : item))

/** An edit: records the undo step, applies `next` and counts a revision. */
export function edit(state: DiagramState, next: Partial<DiagramState>): Partial<DiagramState> {
  return {
    ...next,
    history: history.snapshot(state.history, snap(state)),
    revision: state.revision + 1
  }
}

function restore(state: DiagramState, snapshot: GraphSnapshot): Partial<DiagramState> {
  return {
    nodes: deselected(snapshot.nodes),
    edges: deselected(snapshot.edges),
    selection: { nodes: [], edges: [] },
    connectFrom: null,
    revision: state.revision + 1
  }
}

function without(state: DiagramState, nodeIds: Set<string>, edgeIds: Set<string>): GraphSnapshot {
  const nodes = state.nodes.filter((node) => !nodeIds.has(node.id))
  const edges = state.edges.filter(
    (edge) => !edgeIds.has(edge.id) && !nodeIds.has(edge.source) && !nodeIds.has(edge.target)
  )
  return { nodes, edges }
}

/** Adding, deleting, connecting, styling and undo/redo, each one undoable. */
export function createGraphEdits(set: SetState, get: GetState): GraphEdits {
  return {
    history: history.empty(),

    addNode: (type, center) => {
      const state = get()
      const node = createNode(type, center, state.nodes, state.styleDefaults)
      set(
        edit(state, {
          nodes: [...deselected(state.nodes), node],
          edges: deselected(state.edges),
          selection: { nodes: [node.id], edges: [] }
        })
      )
      return node.id
    },

    deleteSelection: () => {
      const state = get()
      const nodeIds = new Set(state.nodes.filter((n) => n.selected).map((n) => n.id))
      const edgeIds = new Set(state.edges.filter((e) => e.selected).map((e) => e.id))
      if (nodeIds.size === 0 && edgeIds.size === 0) return { nodes: 0, edges: 0 }
      const next = without(state, nodeIds, edgeIds)
      set(edit(state, { ...next, selection: { nodes: [], edges: [] } }))
      return { nodes: nodeIds.size, edges: state.edges.length - next.edges.length }
    },

    removeNodes: (ids) => {
      const state = get()
      const gone = new Set(ids.filter((id) => state.nodes.some((node) => node.id === id)))
      if (gone.size === 0) return
      const next = without(state, gone, new Set())
      set(
        edit(state, {
          ...next,
          selection: {
            nodes: state.selection.nodes.filter((id) => !gone.has(id)),
            edges: state.selection.edges.filter((id) => next.edges.some((e) => e.id === id))
          }
        })
      )
    },

    connect: (source, target) => {
      const state = get()
      const edge = createEdge(source, target, state.edges)
      if (!edge) return null
      set(edit(state, { edges: [...state.edges, edge] }))
      return edge.id
    },

    updateNodeData: (id, patch, { commit = false } = {}) => {
      const state = get()
      const nodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
      )
      set(commit ? edit(state, { nodes }) : { nodes, revision: state.revision + 1 })
    },

    applyStyle: (patch) => {
      const state = get()
      const styled = (node: FlowNode): boolean => Boolean(node.selected) && isFreeForm(node.type)
      const hasNodes = state.nodes.some(styled)
      const hasEdges = state.edges.some((edge) => edge.selected)
      if (!hasNodes && !hasEdges) {
        set({ styleDefaults: { ...state.styleDefaults, ...patch } })
        return
      }
      // Edges only take a stroke color and weight.
      const edgePatch: Partial<Pick<typeof patch, 'stroke' | 'strokeWidth'>> = {}
      if (patch.stroke !== undefined) edgePatch.stroke = patch.stroke
      if (patch.strokeWidth !== undefined) edgePatch.strokeWidth = patch.strokeWidth
      set(
        edit(state, {
          nodes: state.nodes.map((node) =>
            styled(node) ? { ...node, data: { ...node.data, ...patch } } : node
          ),
          edges: state.edges.map((edge): FlowEdge =>
            edge.selected ? { ...edge, data: { ...edge.data, ...edgePatch } } : edge
          )
        })
      )
    },

    undo: () => {
      const state = get()
      const step = history.undo(state.history, snap(state))
      if (!step) return false
      set({ ...restore(state, step.state), history: step.history })
      return true
    },

    redo: () => {
      const state = get()
      const step = history.redo(state.history, snap(state))
      if (!step) return false
      set({ ...restore(state, step.state), history: step.history })
      return true
    }
  }
}
