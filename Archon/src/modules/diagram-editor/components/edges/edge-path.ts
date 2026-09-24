import { getSmoothStepPath, getStraightPath, Position } from '@xyflow/react'
import type { EdgeStyle } from '@/core/types'

export interface EdgeEnds {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export interface EdgePath {
  d: string
  labelX: number
  labelY: number
}

/** Horizontal pull of the curve's control points: `max(40, |dx| * 0.6)`. */
export function curveOffset(dx: number): number {
  return Math.max(40, Math.abs(dx) * 0.6)
}

/**
 * The edge path for a style, leaving the source on the right and entering the
 * target on the left.
 */
export function getSoarEdgePath(style: EdgeStyle, ends: EdgeEnds): EdgePath {
  const { sourceX, sourceY, targetX, targetY } = ends
  if (style === 'orthogonal') {
    const [d, labelX, labelY] = getSmoothStepPath({
      ...ends,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      borderRadius: 8
    })
    return { d, labelX, labelY }
  }
  if (style === 'straight') {
    const [d, labelX, labelY] = getStraightPath(ends)
    return { d, labelX, labelY }
  }
  const offset = curveOffset(targetX - sourceX)
  const d =
    `M${sourceX},${sourceY} ` +
    `C${sourceX + offset},${sourceY} ${targetX - offset},${targetY} ${targetX},${targetY}`
  // The curve is point-symmetric around the midpoint of its ends.
  return { d, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 }
}
