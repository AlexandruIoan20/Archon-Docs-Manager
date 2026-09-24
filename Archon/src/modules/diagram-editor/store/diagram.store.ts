import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange } from '@xyflow/react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import type { SoarDiagram } from '@/core/types'
import type { DiagramGraph, FlowNode } from '../utils/graph-mapping'
import type { DiagramSelection, DiagramState } from './diagram-state'
import { createGraphEdits, edit } from './graph-edits'
import { createToolSlice } from './tool.store'

export type { DiagramSelection, DiagramState, GraphSnapshot, StylePatch } from './diagram-state'
export type DiagramStoreApi = StoreApi<DiagramState>

const EMPTY_SELECTION: DiagramSelection = { nodes: [], edges: [] }

/** Selecting and measuring are not edits; a user resize is (it carries `resizing`). */
const isNodeEdit = (change: NodeChange): boolean =>
  change.type === 'dimensions' ? change.resizing !== undefined : change.type !== 'select'

const isEdgeEdit = (change: EdgeChange): boolean => change.type !== 'select'

/** Where a drag or resize is: `start` records the undo step, `end` closes the gesture. */
function gesturePhase(changes: NodeChange<FlowNode>[]): 'start' | 'move' | 'end' | 'single' {
  const moving = changes.find((c) => c.type === 'position' || c.type === 'dimensions')
  if (!moving) return 'single'
  const active =
    moving.type === 'position' ? moving.dragging : (moving as { resizing?: boolean }).resizing
  if (active === true) return 'move'
  if (active === false) return 'end'
  return 'single'
}

/** One store per open diagram tab (see `store-registry.ts`). */
export function createDiagramStore(
  graph: DiagramGraph,
  base: SoarDiagram | null = null
): DiagramStoreApi {
  return createStore<DiagramState>()((set, get) => ({
    ...graph,
    selection: EMPTY_SELECTION,
    revision: 0,
    base,
    gestureOpen: false,
    ...createToolSlice(set),
    ...createGraphEdits(set, get),

    onNodesChange: (changes) =>
      set((state) => {
        const nodes = applyNodeChanges(changes, state.nodes)
        if (!changes.some(isNodeEdit)) return { nodes }
        const phase = gesturePhase(changes)
        // A drag or resize is one undo step, recorded before its first change.
        if (phase === 'move' && state.gestureOpen) {
          return { nodes, revision: state.revision + 1 }
        }
        if (phase === 'end' && state.gestureOpen) {
          return { nodes, gestureOpen: false, revision: state.revision + 1 }
        }
        return { ...edit(state, { nodes }), gestureOpen: phase === 'move' }
      }),

    onEdgesChange: (changes) =>
      set((state) => {
        const edges = applyEdgeChanges(changes, state.edges)
        return changes.some(isEdgeEdit) ? edit(state, { edges }) : { edges }
      }),

    setViewport: (viewport, persist) =>
      set((state) => {
        const { x, y, zoom } = state.viewport
        const same = x === viewport.x && y === viewport.y && zoom === viewport.zoom
        // The live updates (`persist: false`) usually got there first: a request
        // to persist still counts even when the value is already current.
        if (persist) return { viewport, revision: state.revision + 1 }
        return same ? state : { viewport }
      }),

    setSelection: (selection) => set({ selection }),

    // A version from disk starts a new history, like opening the file.
    replaceGraph: (next) =>
      set({
        ...next,
        selection: EMPTY_SELECTION,
        connectFrom: null,
        history: { past: [], future: [] },
        gestureOpen: false
      }),

    setBase: (next) => set({ base: next })
  }))
}

export function selectCounts(state: DiagramState): string {
  const nodes = state.nodes.length
  const edges = state.edges.length
  return `${nodes} ${nodes === 1 ? 'node' : 'nodes'} · ${edges} ${edges === 1 ? 'edge' : 'edges'}`
}

/** The selected node (or edge) id shown in the status bar; `null` for none. */
export function selectSelectionId(state: DiagramState): string | null {
  return state.selection.nodes[0] ?? state.selection.edges[0] ?? null
}

export function selectZoomPercent(state: DiagramState): number {
  return Math.round(state.viewport.zoom * 100)
}

export const selectCanUndo = (state: DiagramState): boolean => state.history.past.length > 0
export const selectCanRedo = (state: DiagramState): boolean => state.history.future.length > 0
