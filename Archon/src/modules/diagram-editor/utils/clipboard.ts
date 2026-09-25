import type { XYPosition } from '@xyflow/react'
import { diagramEdgeSchema, diagramNodeSchema } from '@/core/schemas/diagram.schema'
import type { FlowEdge, FlowNode } from './graph-mapping'
import { nextId } from './node-factory'

/** Marks our payload in the clipboard (written as text: JSON with this type). */
export const CLIPBOARD_MIME = 'application/x-archon-nodes'
export const PASTE_OFFSET = 24

export interface NodeClipboard {
  type: typeof CLIPBOARD_MIME
  version: 1
  nodes: FlowNode[]
  /** Only edges between copied nodes. */
  edges: FlowEdge[]
}

const RUNTIME_KEYS = ['selected', 'dragging', 'measured', 'resizing'] as const

function clean<T extends object>(item: T): T {
  const copy = { ...item } as Record<string, unknown>
  for (const key of RUNTIME_KEYS) delete copy[key]
  return copy as T
}

/** The selected nodes and the edges among them; `null` when no node is selected. */
export function copySelection(
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[]
): NodeClipboard | null {
  const picked = nodes.filter((node) => node.selected)
  if (picked.length === 0) return null
  const ids = new Set(picked.map((node) => node.id))
  return {
    type: CLIPBOARD_MIME,
    version: 1,
    nodes: picked.map(clean),
    edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map(clean)
  }
}

export const serializeClipboard = (payload: NodeClipboard): string => JSON.stringify(payload)

/** Our payload from clipboard text, validated; `null` for anything else. */
export function parseClipboard(text: string): NodeClipboard | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (value.type !== CLIPBOARD_MIME || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null
  }
  const nodes = value.nodes.map((n) => diagramNodeSchema.safeParse(n))
  const edges = value.edges.map((e) => diagramEdgeSchema.safeParse(e))
  if (nodes.length === 0 || [...nodes, ...edges].some((r) => !r.success)) return null
  return {
    type: CLIPBOARD_MIME,
    version: 1,
    nodes: nodes.map((r) => r.data as unknown as FlowNode),
    edges: edges.map(({ data }) => {
      const edge = { ...(data as Record<string, unknown>) }
      if (edge.label === null) delete edge.label
      return edge as unknown as FlowEdge
    })
  }
}

export interface PastePlacement {
  /** Moves everything by this much (repeated pastes: 24, 48…). */
  offset?: number
  /** Or puts the top-left of the copied nodes here (context menu). */
  at?: XYPosition
}

/**
 * The payload as new nodes and edges: fresh ids (`N<k>` / `E<k>` not taken),
 * edges remapped to them, positions moved, everything selected.
 */
export function pasteGraph(
  payload: NodeClipboard,
  existingNodes: readonly FlowNode[],
  existingEdges: readonly FlowEdge[],
  { offset = PASTE_OFFSET, at }: PastePlacement = {}
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const takenNodes = existingNodes.map((n) => n.id)
  const takenEdges = existingEdges.map((e) => e.id)
  const ids = new Map<string, string>()
  const minX = Math.min(...payload.nodes.map((n) => n.position.x))
  const minY = Math.min(...payload.nodes.map((n) => n.position.y))
  const dx = at ? at.x - minX : offset
  const dy = at ? at.y - minY : offset

  const nodes = payload.nodes.map((node): FlowNode => {
    const id = nextId('N', takenNodes)
    takenNodes.push(id)
    ids.set(node.id, id)
    return {
      ...node,
      id,
      position: { x: Math.round(node.position.x + dx), y: Math.round(node.position.y + dy) },
      data: { ...node.data, tags: [...node.data.tags] },
      selected: true
    }
  })
  const edges = payload.edges.flatMap((edge): FlowEdge[] => {
    const source = ids.get(edge.source)
    const target = ids.get(edge.target)
    if (!source || !target) return []
    const id = nextId('E', takenEdges)
    takenEdges.push(id)
    return [{ ...edge, id, source, target, selected: false }]
  })
  return { nodes, edges }
}
