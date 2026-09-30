import type { XYPosition } from '@xyflow/react'
import { boundingRect, type Rect } from './node-rect'

export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type DistributeAxis = 'horizontal' | 'vertical'

/** Boxes by node id. */
export type Boxes = ReadonlyMap<string, Rect>

/** Positions that change, by node id; unchanged boxes are left out. */
export type Moves = Map<string, XYPosition>

function changed(boxes: Boxes, place: (box: Rect, id: string) => XYPosition): Moves {
  const moves: Moves = new Map()
  for (const [id, box] of boxes) {
    const next = place(box, id)
    if (next.x !== box.x || next.y !== box.y) moves.set(id, next)
  }
  return moves
}

/** Lines the boxes up on an edge or the centre of the box around them all. */
export function alignBoxes(boxes: Boxes, mode: AlignMode): Moves {
  const all = boundingRect([...boxes.values()])
  if (!all || boxes.size < 2) return new Map()
  const right = all.x + all.width
  const bottom = all.y + all.height
  return changed(boxes, (box) => {
    switch (mode) {
      case 'left':
        return { x: all.x, y: box.y }
      case 'center':
        return { x: all.x + (all.width - box.width) / 2, y: box.y }
      case 'right':
        return { x: right - box.width, y: box.y }
      case 'top':
        return { x: box.x, y: all.y }
      case 'middle':
        return { x: box.x, y: all.y + (all.height - box.height) / 2 }
      case 'bottom':
        return { x: box.x, y: bottom - box.height }
    }
  })
}

/**
 * Spaces three or more boxes with equal gaps between the first and the last
 * (in order of their centres), which stay where they are.
 */
export function distributeBoxes(boxes: Boxes, axis: DistributeAxis): Moves {
  if (boxes.size < 3) return new Map()
  const horizontal = axis === 'horizontal'
  const start = (box: Rect): number => (horizontal ? box.x : box.y)
  const size = (box: Rect): number => (horizontal ? box.width : box.height)
  const ordered = [...boxes].sort(
    ([, a], [, b]) => start(a) + size(a) / 2 - (start(b) + size(b) / 2)
  )
  const first = ordered[0]![1]
  const last = ordered.at(-1)![1]
  const span = start(last) + size(last) - start(first)
  const filled = ordered.reduce((sum, [, box]) => sum + size(box), 0)
  const gap = (span - filled) / (ordered.length - 1)

  const targets = new Map<string, number>()
  let cursor = start(first)
  for (const [id, box] of ordered) {
    targets.set(id, cursor)
    cursor += size(box) + gap
  }
  return changed(boxes, (box, id) => {
    const at = targets.get(id)!
    return horizontal ? { x: at, y: box.y } : { x: box.x, y: at }
  })
}
