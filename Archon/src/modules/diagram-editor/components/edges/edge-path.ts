import { getSmoothStepPath, getStraightPath, Position } from '@xyflow/react'
import type { EdgeStyle } from '@/core/types'

export interface EdgeEnds {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  /** The side the edge leaves the source on; right by default. */
  sourcePosition?: Position
  /** The side the edge enters the target on; left by default. */
  targetPosition?: Position
}

export interface EdgePath {
  d: string
  labelX: number
  labelY: number
}

const OUTWARD: Record<Position, { x: number; y: number }> = {
  [Position.Top]: { x: 0, y: -1 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Bottom]: { x: 0, y: 1 },
  [Position.Left]: { x: -1, y: 0 }
}

/** Pull of a control point away from its side: `max(40, |d| * 0.6)`, `d` along that side's axis. */
export function curveOffset(d: number): number {
  return Math.max(40, Math.abs(d) * 0.6)
}

/** The edge path for a style, leaving and entering the nodes on the given sides. */
export function getSoarEdgePath(style: EdgeStyle, ends: EdgeEnds): EdgePath {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Right,
    targetPosition = Position.Left
  } = ends
  if (style === 'orthogonal') {
    const [d, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 8
    })
    return { d, labelX, labelY }
  }
  if (style === 'straight') {
    const [d, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
    return { d, labelX, labelY }
  }
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const control = (x: number, y: number, side: Position): { x: number; y: number } => {
    const out = OUTWARD[side]
    const offset = curveOffset(out.x !== 0 ? dx : dy)
    return { x: x + out.x * offset, y: y + out.y * offset }
  }
  const c1 = control(sourceX, sourceY, sourcePosition)
  const c2 = control(targetX, targetY, targetPosition)
  const d = `M${sourceX},${sourceY} C${c1.x},${c1.y} ${c2.x},${c2.y} ${targetX},${targetY}`
  // The label sits on the curve's point at t = 0.5.
  return {
    d,
    labelX: (sourceX + 3 * c1.x + 3 * c2.x + targetX) / 8,
    labelY: (sourceY + 3 * c1.y + 3 * c2.y + targetY) / 8
  }
}
