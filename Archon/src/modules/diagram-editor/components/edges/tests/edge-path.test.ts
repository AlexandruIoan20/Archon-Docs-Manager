import { describe, expect, it } from 'vitest'
import { curveOffset, getSoarEdgePath } from '../edge-path'

const ENDS = { sourceX: 100, sourceY: 50, targetX: 300, targetY: 150 }

describe('getSoarEdgePath', () => {
  it('curves out of the source to the right and into the target from the left', () => {
    expect(getSoarEdgePath('curved', ENDS)).toEqual({
      d: 'M100,50 C220,50 180,150 300,150',
      labelX: 200,
      labelY: 100
    })
    expect(curveOffset(10)).toBe(40)
  })

  it('draws orthogonal steps with rounded corners', () => {
    const { d } = getSoarEdgePath('orthogonal', ENDS)
    expect(d).toMatchInlineSnapshot(
      `"M100 50L120 50L 192,50Q 200,50 200,58L 200,142Q 200,150 208,150L280 150L300 150"`
    )
  })

  it('draws a straight line', () => {
    expect(getSoarEdgePath('straight', ENDS).d).toBe('M 100,50L 300,150')
  })

  it('gives each style its own path', () => {
    const paths = (['curved', 'orthogonal', 'straight'] as const).map(
      (style) => getSoarEdgePath(style, ENDS).d
    )
    expect(new Set(paths).size).toBe(3)
  })
})
