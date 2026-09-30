import { describe, expect, it } from 'vitest'
import type { Rect } from '../node-rect'
import { snapRect } from '../smart-guides'

const box = (x: number, y: number, width = 100, height = 50): Rect => ({ x, y, width, height })

describe('snapRect', () => {
  it('snaps an edge onto another node within the threshold, with a guide line', () => {
    const { dx, dy, guides } = snapRect(box(304, 200), [box(0, 0), box(300, 0)], 6)
    expect(dx).toBe(-4)
    expect(dy).toBe(0)
    // Left edges, centres and right edges of the two boxes stacked at x = 300.
    expect(guides.align).toContainEqual({ x1: 300, y1: 0, x2: 300, y2: 250 })
  })

  it('leaves a node alone when nothing is close enough', () => {
    const { dx, dy, guides } = snapRect(box(520, 300), [box(0, 0)], 6)
    expect({ dx, dy }).toEqual({ dx: 0, dy: 0 })
    expect(guides).toEqual({ align: [], gaps: [] })
  })

  it('repeats the gap of its row, and shows both gaps', () => {
    // A (0–100) · 50 · B (150–250) · ? · moving; off-row vertically so only gaps can snap x.
    const others = [box(0, 0), box(150, 0)]
    const { dx, guides } = snapRect(box(303, 10), others, 6)
    expect(dx).toBe(-3)
    expect(guides.gaps).toHaveLength(2)
    expect(guides.gaps).toContainEqual({ x1: 250, y1: 30, x2: 300, y2: 30 })
  })

  it('centres a node between two neighbours', () => {
    // Room from -100 to 260 fits the 100-wide node centred at x = 30.
    expect(snapRect(box(27, 400), [box(-200, 400), box(260, 400)], 6).dx).toBe(3)
  })
})
