import { describe, expect, it } from 'vitest'
import { computeSubmenuPosition } from '../floating-position'

const viewport = { width: 720, height: 480 }
const size = { width: 176, height: 160 }

describe('computeSubmenuPosition', () => {
  it('opens to the right of its item', () => {
    const item = { x: 100, y: 100, width: 200, height: 28 }
    expect(computeSubmenuPosition(item, size, viewport)).toEqual({ x: 300, y: 96, side: 'right' })
  })

  it('opens to the left when the right side is too narrow', () => {
    const item = { x: 450, y: 100, width: 200, height: 28 }
    expect(computeSubmenuPosition(item, size, viewport)).toMatchObject({ x: 274, side: 'left' })
  })

  it('moves up to stay in the window', () => {
    const item = { x: 100, y: 440, width: 200, height: 28 }
    expect(computeSubmenuPosition(item, size, viewport).y).toBe(480 - 8 - 160)
  })
})
