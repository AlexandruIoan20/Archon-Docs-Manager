import type { NodeChange, NodePositionChange } from '@xyflow/react'
import type { FlowNode } from '../utils/graph-mapping'
import { boundingRect, nodeRect } from '../utils/node-rect'
import { snapRect, type Guides } from '../utils/smart-guides'

/** How close, in screen pixels, a dragged node must come to snap. */
export const SNAP_DISTANCE = 6

type Dragged = NodePositionChange & { position: NonNullable<NodePositionChange['position']> }

const isDragged = (change: NodeChange<FlowNode>): change is Dragged =>
  change.type === 'position' && change.dragging === true && change.position !== undefined

/**
 * Snaps a drag: the dragged nodes move together, so their common box snaps
 * to the other nodes. `guides` is `null` when nothing is being dragged.
 */
export function snapDrag(
  changes: NodeChange<FlowNode>[],
  nodes: readonly FlowNode[],
  zoom: number
): { changes: NodeChange<FlowNode>[]; guides: Guides | null } {
  const dragged = changes.filter(isDragged)
  if (dragged.length === 0) return { changes, guides: null }

  const byId = new Map(nodes.map((node) => [node.id, node]))
  const moving = new Set(dragged.map((change) => change.id))
  const box = boundingRect(
    dragged.flatMap((change) => {
      const node = byId.get(change.id)
      return node ? [{ ...nodeRect(node), ...change.position }] : []
    })
  )
  if (!box) return { changes, guides: null }

  const others = nodes.filter((node) => !moving.has(node.id)).map(nodeRect)
  const { dx, dy, guides } = snapRect(box, others, SNAP_DISTANCE / zoom)
  if (dx === 0 && dy === 0) return { changes, guides }
  return {
    changes: changes.map((change) =>
      isDragged(change)
        ? { ...change, position: { x: change.position.x + dx, y: change.position.y + dy } }
        : change
    ),
    guides
  }
}
