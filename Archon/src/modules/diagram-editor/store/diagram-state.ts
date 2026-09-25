import type { EdgeChange, NodeChange, Viewport, XYPosition } from '@xyflow/react'
import type { DiagramNodeType, ArchonDiagram } from '@/core/types'
import type { DiagramTool, PlaceableKind } from '../constants/tools'
import type { DiagramGraph, FlowEdge, FlowNodeData, FlowNode } from '../utils/graph-mapping'
import type { StyleDefaults } from '../utils/node-factory'
import type { HistoryState } from './history'

export interface DiagramSelection {
  nodes: string[]
  edges: string[]
}

/** What undo/redo restores: the graph, not the selection or the viewport. */
export interface GraphSnapshot {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type StylePatch = Partial<StyleDefaults>

export interface ToolState {
  tool: DiagramTool
  /** What Add node places. */
  nodeKind: PlaceableKind
  /** First node picked by the connect tool. */
  connectFrom: string | null
  /** Style of the next shape or text, and of edits without a selection. */
  styleDefaults: StyleDefaults
  setTool: (tool: DiagramTool) => void
  setNodeKind: (kind: PlaceableKind) => void
  setConnectFrom: (id: string | null) => void
}

export interface GraphEdits {
  history: HistoryState<GraphSnapshot>
  /** Places a node centred on `center` and selects it. Returns its id. */
  addNode: (type: DiagramNodeType, center: XYPosition) => string
  /** Adds nodes and edges (paste, duplicate), selected alone, as one undo step. */
  insertElements: (nodes: FlowNode[], edges: FlowEdge[]) => void
  /** Turns a node into another type, keeping its data; one undo step. */
  changeNodeType: (id: string, type: DiagramNodeType) => void
  /** Deletes the selected nodes (with their edges) and edges. Returns what went. */
  deleteSelection: () => { nodes: number; edges: number }
  removeNodes: (ids: readonly string[]) => void
  /** Adds a source → target edge; `null` for a loop or a duplicate. */
  connect: (source: string, target: string) => string | null
  /** `commit: true` records an undo step first (the properties panel commits once per field edit). */
  updateNodeData: (id: string, patch: Partial<FlowNodeData>, options?: { commit?: boolean }) => void
  /** The same patch on several nodes, as one undo step. */
  updateNodesData: (ids: readonly string[], patch: Partial<FlowNodeData>) => void
  /** An empty label removes it. `commit` as in `updateNodeData`. */
  setEdgeLabel: (id: string, label: string, options?: { commit?: boolean }) => void
  /** Styles the selected shapes, text and edges; without any, the defaults. */
  applyStyle: (patch: StylePatch) => void
  undo: () => boolean
  redo: () => boolean
}

/** The text editor of an `engine: 'mermaid'` diagram. */
export interface MermaidState {
  /** Share of the source pane, in percent (20–80). Kept for the tab's session. */
  splitRatio: number
  /** Zoom of the preview; not saved. */
  previewZoom: number
  /** Edits `meta.mermaidSource`: a change to save. */
  setMermaidSource: (source: string) => void
  setSplitRatio: (ratio: number) => void
  setPreviewZoom: (zoom: number) => void
}

export interface DiagramState extends DiagramGraph, ToolState, GraphEdits, MermaidState {
  selection: DiagramSelection
  /** Bumped by every change that belongs in the file; autosave follows it. */
  revision: number
  /** The disk version the state is based on (set on load, save and reload). */
  base: ArchonDiagram | null
  /** A drag or resize is under way: its undo step was already recorded. */
  gestureOpen: boolean

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void
  /** `persist: false` for the live viewport while panning (status bar zoom). */
  setViewport: (viewport: Viewport, persist: boolean) => void
  setSelection: (selection: DiagramSelection) => void
  /** Selects exactly these nodes (a search result, a new diagram's N1). */
  selectNodes: (ids: readonly string[]) => void
  /** Changes file metadata; `save: false` when it was already written (export). */
  patchMeta: (patch: Partial<DiagramGraph['meta']>, options?: { save?: boolean }) => void
  /** Replaces the graph with a version from disk; not a change to save. */
  replaceGraph: (graph: DiagramGraph) => void
  setBase: (base: ArchonDiagram) => void
}

export type SetState = (
  partial: Partial<DiagramState> | ((state: DiagramState) => Partial<DiagramState>)
) => void
export type GetState = () => DiagramState
