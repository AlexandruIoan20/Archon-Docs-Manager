import { describe, expect, it } from 'vitest'
import { facingHandles } from '../edge-handles'
import type { FlowNode } from '../graph-mapping'

const node = (x: number, y: number): FlowNode => ({
  id: `${x},${y}`,
  type: 'action',
  position: { x, y },
  data: {} as FlowNode['data']
})

describe('facingHandles', () => {
  it('picks the sides two nodes face each other with', () => {
    const origin = node(0, 0)
    expect(facingHandles(origin, node(400, 50))).toEqual({
      sourceHandle: 'right',
      targetHandle: 'left'
    })
    expect(facingHandles(origin, node(-400, 0))).toEqual({
      sourceHandle: 'left',
      targetHandle: 'right'
    })
    expect(facingHandles(origin, node(50, 300))).toEqual({
      sourceHandle: 'bottom',
      targetHandle: 'top'
    })
    expect(facingHandles(origin, node(0, -300))).toEqual({
      sourceHandle: 'top',
      targetHandle: 'bottom'
    })
  })
})
