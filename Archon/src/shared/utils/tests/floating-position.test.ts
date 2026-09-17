import { describe, expect, it } from 'vitest'
import { computeFloatingPosition, type FloatingPositionInput } from '../floating-position'

const viewport = { width: 720, height: 480 }
const menu = { width: 190, height: 150 }

function place(
  overrides: Partial<FloatingPositionInput>
): ReturnType<typeof computeFloatingPosition> {
  return computeFloatingPosition({
    anchor: { x: 100, y: 40, width: 80, height: 30 },
    floating: menu,
    viewport,
    placement: 'bottom-start',
    ...overrides
  })
}

describe('computeFloatingPosition', () => {
  it('places below the anchor, aligned to its start', () => {
    expect(place({})).toEqual({ x: 100, y: 74, side: 'bottom', maxHeight: 398 })
  })

  it('aligns to the anchor end', () => {
    const anchor = { x: 300, y: 40, width: 80, height: 30 }
    expect(place({ placement: 'bottom-end', anchor }).x).toBe(300 + 80 - 190)
  })

  it('centers on the anchor', () => {
    expect(place({ placement: 'bottom' }).x).toBe(100 + 40 - 95)
  })

  it('flips above when the anchor is near the bottom edge', () => {
    const result = place({ anchor: { x: 100, y: 420, width: 80, height: 30 } })
    expect(result.side).toBe('top')
    expect(result.y).toBe(420 - 4 - 150)
  })

  it('keeps the preferred side when the opposite one is not larger', () => {
    const result = place({
      anchor: { x: 100, y: 200, width: 80, height: 30 },
      floating: { width: 190, height: 400 }
    })
    expect(result.side).toBe('bottom')
    expect(result.maxHeight).toBe(480 - 230 - 4 - 8)
  })

  it('limits the height when neither side fits', () => {
    const result = place({
      anchor: { x: 100, y: 100, width: 80, height: 30 },
      floating: { width: 190, height: 600 }
    })
    expect(result.side).toBe('bottom')
    expect(result.maxHeight).toBe(338)
    expect(result.y).toBe(134)
  })

  it('shifts left at the right edge of the viewport', () => {
    expect(place({ anchor: { x: 680, y: 40, width: 30, height: 30 } }).x).toBe(720 - 8 - 190)
  })

  it('shifts right at the left edge of the viewport', () => {
    expect(
      place({ placement: 'bottom-end', anchor: { x: 0, y: 40, width: 30, height: 30 } }).x
    ).toBe(8)
  })

  it('pins to the left margin when wider than the viewport', () => {
    expect(place({ floating: { width: 900, height: 100 } }).x).toBe(8)
  })

  it('supports a zero-size anchor at the pointer', () => {
    expect(place({ anchor: { x: 300, y: 200, width: 0, height: 0 }, offset: 0 })).toMatchObject({
      x: 300,
      y: 200,
      side: 'bottom'
    })
    expect(place({ anchor: { x: 300, y: 400, width: 0, height: 0 }, offset: 0 })).toMatchObject({
      x: 300,
      y: 400 - 150,
      side: 'top'
    })
  })
})
