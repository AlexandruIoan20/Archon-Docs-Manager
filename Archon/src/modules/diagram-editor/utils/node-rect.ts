import { NODE_KINDS } from '../constants/node-kinds'
import type { FlowNode } from './graph-mapping'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** A node's box on the canvas: measured size, else its own, else its kind's default. */
export function nodeRect(node: FlowNode): Rect {
  const { size } = NODE_KINDS[node.type ?? 'element']
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width ?? node.width ?? size.width,
    height: node.measured?.height ?? node.height ?? size.height
  }
}

/** The smallest box around all of `rects`; `null` for none. */
export function boundingRect(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null
  const left = Math.min(...rects.map((r) => r.x))
  const top = Math.min(...rects.map((r) => r.y))
  const right = Math.max(...rects.map((r) => r.x + r.width))
  const bottom = Math.max(...rects.map((r) => r.y + r.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}
