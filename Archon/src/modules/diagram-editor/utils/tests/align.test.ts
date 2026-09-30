import { describe, expect, it } from 'vitest'
import { alignBoxes, distributeBoxes } from '../align'

const boxes = new Map([
  ['A', { x: 0, y: 0, width: 100, height: 40 }],
  ['B', { x: 50, y: 100, width: 200, height: 60 }],
  ['C', { x: 400, y: 30, width: 100, height: 40 }]
])

describe('alignBoxes', () => {
  it('lines up on the edges and centres of the box around the selection', () => {
    expect(alignBoxes(boxes, 'left')).toEqual(
      new Map([
        ['B', { x: 0, y: 100 }],
        ['C', { x: 0, y: 30 }]
      ])
    )
    expect(alignBoxes(boxes, 'right').get('A')).toEqual({ x: 400, y: 0 })
    expect(alignBoxes(boxes, 'center').get('B')).toEqual({ x: 150, y: 100 })
    expect(alignBoxes(boxes, 'bottom').get('A')).toEqual({ x: 0, y: 120 })
    expect(alignBoxes(boxes, 'middle').get('C')).toEqual({ x: 400, y: 60 })
  })

  it('needs two boxes', () => {
    expect(alignBoxes(new Map([...boxes].slice(0, 1)), 'left').size).toBe(0)
  })
})

describe('distributeBoxes', () => {
  it('keeps the outer boxes and evens the gaps', () => {
    // Span 0–500, 400 filled: two gaps of 50.
    expect(distributeBoxes(boxes, 'horizontal')).toEqual(new Map([['B', { x: 150, y: 100 }]]))
  })

  it('needs three boxes', () => {
    expect(distributeBoxes(new Map([...boxes].slice(0, 2)), 'vertical').size).toBe(0)
  })
})
