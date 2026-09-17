import { describe, expect, it } from 'vitest'
import { resolveInitialBounds } from './window-bounds'

const PREFERRED = { width: 1440, height: 900 }
const MIN = { width: 720, height: 480 }

describe('resolveInitialBounds', () => {
  it('uses the preferred size when the screen has room for it', () => {
    const bounds = resolveInitialBounds({ x: 0, y: 0, width: 2560, height: 1400 }, PREFERRED, MIN)
    expect(bounds).toEqual({
      x: 560,
      y: 250,
      width: 1440,
      height: 900,
      minWidth: 720,
      minHeight: 480
    })
  })

  it('limits the window to 90% of a small work area', () => {
    const bounds = resolveInitialBounds({ x: 0, y: 0, width: 1280, height: 680 }, PREFERRED, MIN)
    expect(bounds).toMatchObject({ width: 1152, height: 612, minWidth: 720, minHeight: 480 })
  })

  it('lowers the minimum on screens smaller than it and fills the work area', () => {
    const bounds = resolveInitialBounds({ x: 0, y: 0, width: 700, height: 450 }, PREFERRED, MIN)
    expect(bounds).toEqual({
      x: 0,
      y: 0,
      width: 700,
      height: 450,
      minWidth: 700,
      minHeight: 450
    })
  })

  it('opens fully visible on a 1366×768 screen at 125% scaling', () => {
    // 1093×570 CSS px after scaling, minus a taskbar.
    const workArea = { x: 0, y: 0, width: 1093, height: 546 }
    const bounds = resolveInitialBounds(workArea, PREFERRED, MIN)
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(workArea.width)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(workArea.height)
    expect(bounds.minHeight).toBe(480)
  })

  it('centers the window inside an offset work area (secondary display)', () => {
    const bounds = resolveInitialBounds(
      { x: 1920, y: 40, width: 1600, height: 1000 },
      PREFERRED,
      MIN
    )
    expect(bounds).toMatchObject({ x: 1920 + 80, y: 40 + 50, width: 1440, height: 900 })
  })
})
