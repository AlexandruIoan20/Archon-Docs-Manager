import type { Edge, Node, Viewport } from '@xyflow/react'
import type { DiagramEdge, DiagramNode, DiagramNodeType, SoarDiagram } from '@/core/types'

export type FlowNodeData = DiagramNode['data']
export type FlowNode = Node<FlowNodeData, DiagramNodeType>
export type FlowEdge = Edge

/** Everything in the file except the graph itself (title, type, style, tags…). */
export type DiagramMeta = Omit<SoarDiagram, 'data'>

export interface DiagramGraph {
  meta: DiagramMeta
  nodes: FlowNode[]
  edges: FlowEdge[]
  viewport: Viewport
}

/** The React Flow edge type of SOAR edges; implied in the file, so never written. */
export const SOAR_EDGE_TYPE = 'soar'

/** State React Flow adds while editing; it never goes into the file. */
const NODE_RUNTIME_KEYS = ['selected', 'dragging', 'measured', 'resizing'] as const
const EDGE_RUNTIME_KEYS = ['selected'] as const

function without<T extends object>(item: T, keys: readonly string[]): T {
  const copy = { ...item } as Record<string, unknown>
  for (const key of keys) delete copy[key]
  return copy as T
}

/** A viewport never moved: the diagram opens with `fitView` instead. */
export function isDefaultViewport({ x, y, zoom }: Viewport): boolean {
  return x === 0 && y === 0 && zoom === 1
}

/** `.soardiag` (defaults already applied by the schema) → React Flow state. */
export function fileToGraph(diagram: SoarDiagram): DiagramGraph {
  const { data, ...meta } = diagram
  return {
    meta,
    // The file keeps React Flow's node shape; extra fields from newer versions stay.
    nodes: data.nodes.map((node) => ({ ...node }) as FlowNode),
    edges: data.edges.map(({ label, ...edge }) => ({
      ...edge,
      type: typeof edge.type === 'string' ? edge.type : SOAR_EDGE_TYPE,
      ...(label === null ? {} : { label })
    })),
    viewport: { ...data.viewport }
  }
}

/** React Flow state → `.soardiag`, without runtime-only fields. */
export function graphToFile({ meta, nodes, edges, viewport }: DiagramGraph): SoarDiagram {
  return {
    ...meta,
    data: {
      nodes: nodes.map((node) => without(node, NODE_RUNTIME_KEYS) as unknown as DiagramNode),
      edges: edges.map((edge) => {
        const { label, ...rest } = without(edge, EDGE_RUNTIME_KEYS)
        if (rest.type === SOAR_EDGE_TYPE) delete rest.type
        return { ...rest, label: typeof label === 'string' ? label : null } as DiagramEdge
      }),
      viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
    }
  }
}
