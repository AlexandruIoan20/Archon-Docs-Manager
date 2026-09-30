import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'
import type { Moves } from './align'
import type { EdgeHandles } from './edge-handles'
import type { FlowEdge, FlowNode } from './graph-mapping'
import { isFreeForm } from './node-factory'
import { boundingRect, nodeRect, type Rect } from './node-rect'

/** `TB`: top to bottom; `LR`: left to right. */
export type LayoutDirection = 'TB' | 'LR'

const NODE_GAP = 48
const RANK_GAP = 80

export interface Arrangement {
  moves: Moves
  /** New sides for the edges between arranged nodes, by edge id. */
  handles: Map<string, EdgeHandles>
}

/**
 * The nodes an arrangement moves: SOAR nodes, and shapes or text with edges.
 * Loose shapes and notes are annotations and stay where they are.
 */
export function arrangeable(nodes: readonly FlowNode[], edges: readonly FlowEdge[]): FlowNode[] {
  const linked = new Set(edges.flatMap((edge) => [edge.source, edge.target]))
  return nodes.filter((node) => !isFreeForm(node.type) || linked.has(node.id))
}

/** The sides an edge takes in a layered layout: forward along the flow, back against it. */
function flowHandles(source: Rect, target: Rect, direction: LayoutDirection): EdgeHandles {
  const forward =
    direction === 'TB'
      ? target.y + target.height / 2 >= source.y + source.height / 2
      : target.x + target.width / 2 >= source.x + source.width / 2
  const [out, into] =
    direction === 'TB' ? [Position.Bottom, Position.Top] : [Position.Right, Position.Left]
  return forward
    ? { sourceHandle: out, targetHandle: into }
    : { sourceHandle: into, targetHandle: out }
}

/**
 * Lays `nodes` out in layers along `direction` (dagre), keeping the top-left
 * corner of their box where it was, and turns their edges to follow the flow.
 */
export function arrange(
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  direction: LayoutDirection
): Arrangement {
  const boxes = new Map(nodes.map((node) => [node.id, nodeRect(node)]))
  const inner = edges.filter((edge) => boxes.has(edge.source) && boxes.has(edge.target))

  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: direction, nodesep: NODE_GAP, ranksep: RANK_GAP })
  graph.setDefaultEdgeLabel(() => ({}))
  for (const [id, box] of boxes) graph.setNode(id, { width: box.width, height: box.height })
  for (const edge of inner) graph.setEdge(edge.source, edge.target)
  dagre.layout(graph)

  // Dagre gives centres from its own origin; the arrangement stays where the nodes were.
  const laidOut = new Map<string, Rect>()
  for (const [id, box] of boxes) {
    const { x, y } = graph.node(id)
    laidOut.set(id, { ...box, x: x - box.width / 2, y: y - box.height / 2 })
  }
  const before = boundingRect([...boxes.values()])
  const after = boundingRect([...laidOut.values()])
  const dx = before && after ? before.x - after.x : 0
  const dy = before && after ? before.y - after.y : 0

  const moves: Moves = new Map()
  for (const [id, box] of laidOut) {
    const next = { x: Math.round(box.x + dx), y: Math.round(box.y + dy) }
    const old = boxes.get(id)!
    if (next.x !== old.x || next.y !== old.y) moves.set(id, next)
    laidOut.set(id, { ...box, ...next })
  }
  const handles = new Map(
    inner.map((edge) => [
      edge.id,
      flowHandles(laidOut.get(edge.source)!, laidOut.get(edge.target)!, direction)
    ])
  )
  return { moves, handles }
}
