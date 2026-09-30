import { Position } from '@xyflow/react'
import type { FlowNode } from './graph-mapping'
import { nodeRect } from './node-rect'

/** Every node has a handle on each side; a handle's id is its side. */
export const HANDLE_SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left] as const

/** An edge without handles in the file leaves on the right and enters on the left. */
export const DEFAULT_SOURCE_HANDLE: string = Position.Right
export const DEFAULT_TARGET_HANDLE: string = Position.Left

export interface EdgeHandles {
  sourceHandle: string
  targetHandle: string
}

function center(node: FlowNode): { x: number; y: number } {
  const { x, y, width, height } = nodeRect(node)
  return { x: x + width / 2, y: y + height / 2 }
}

/**
 * The sides two nodes face each other with: bottom → top when the target is
 * mostly below, right → left when it is mostly to the right, and so on.
 */
export function facingHandles(source: FlowNode, target: FlowNode): EdgeHandles {
  const a = center(source)
  const b = center(target)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0
      ? { sourceHandle: Position.Bottom, targetHandle: Position.Top }
      : { sourceHandle: Position.Top, targetHandle: Position.Bottom }
  }
  return dx >= 0
    ? { sourceHandle: Position.Right, targetHandle: Position.Left }
    : { sourceHandle: Position.Left, targetHandle: Position.Right }
}
