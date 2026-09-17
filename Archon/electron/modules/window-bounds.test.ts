import { describe, expect, it } from 'vitest'
import { resolveInitialBounds, type Rect } from './window-bounds'

const PREFERRED = { width: 1440, height: 900 }
const MIN = { width: 720, height: 480 }

function fresh(workArea: Rect): ReturnType<typeof resolveInitialBounds> {
  return resolveInitialBounds({ workArea, displays: [workArea], preferred: PREFERRED, min: MIN })
}

describe('resolveInitialBounds without saved bounds', () => {
  it('uses the preferred size when the screen has room for it', () => {
    expect(fresh({ x: 0, y: 0, width: 2560, height: 1400 })).toEqual({
      x: 560,
      y: 250,
      width: 1440,
      height: 900,
      minWidth: 720,
      minHeight: 480
    })
  })

  it('limits the window to 90% of a small work area', () => {
    expect(fresh({ x: 0, y: 0, width: 1280, height: 680 })).toMatchObject({
      width: 1152,
      height: 612,
      minWidth: 720,
      minHeight: 480
    })
  })

  it('lowers the minimum on screens smaller than it and fills the work area', () => {
    expect(fresh({ x: 0, y: 0, width: 700, height: 450 })).toEqual({
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
    const bounds = fresh(workArea)
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(workArea.width)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(workArea.height)
    expect(bounds.minHeight).toBe(480)
  })

  it('centers the window inside an offset work area (secondary display)', () => {
    expect(fresh({ x: 1920, y: 40, width: 1600, height: 1000 })).toMatchObject({
      x: 1920 + 80,
      y: 40 + 50,
      width: 1440,
      height: 900
    })
  })
})

describe('resolveInitialBounds with saved bounds', () => {
  const laptop = { x: 0, y: 0, width: 1536, height: 824 }
  const external = { x: 1536, y: 0, width: 2560, height: 1400 }

  it('restores bounds that are on a connected display', () => {
    const saved = { x: 1800, y: 100, width: 1600, height: 1000 }
    const bounds = resolveInitialBounds({
      workArea: laptop,
      displays: [laptop, external],
      preferred: PREFERRED,
      min: MIN,
      saved
    })
    expect(bounds).toEqual({ ...saved, minWidth: 720, minHeight: 480 })
  })

  it('centers on the current screen when the saved display is gone', () => {
    const saved = { x: 1800, y: 100, width: 1600, height: 1000 }
    const bounds = resolveInitialBounds({
      workArea: laptop,
      displays: [laptop],
      preferred: PREFERRED,
      min: MIN,
      saved
    })
    expect(bounds).toEqual(fresh(laptop))
  })

  it('ignores bounds that are mostly off-screen', () => {
    const saved = { x: 1000, y: 0, width: 1200, height: 800 } // 536 of 1200px on the laptop
    const bounds = resolveInitialBounds({
      workArea: laptop,
      displays: [laptop],
      preferred: PREFERRED,
      min: MIN,
      saved
    })
    expect(bounds).toEqual(fresh(laptop))
  })

  it('shrinks bounds larger than their display and moves them fully onto it', () => {
    const saved = { x: -40, y: -20, width: 1900, height: 1000 }
    const bounds = resolveInitialBounds({
      workArea: laptop,
      displays: [laptop],
      preferred: PREFERRED,
      min: MIN,
      saved
    })
    expect(bounds).toEqual({ x: 0, y: 0, width: 1536, height: 824, minWidth: 720, minHeight: 480 })
  })

  it('pulls partly visible bounds back inside the display', () => {
    const saved = { x: 600, y: 300, width: 1200, height: 700 } // right and bottom edges spill over
    const bounds = resolveInitialBounds({
      workArea: laptop,
      displays: [laptop],
      preferred: PREFERRED,
      min: MIN,
      saved
    })
    expect(bounds).toMatchObject({ x: 336, y: 124, width: 1200, height: 700 })
  })
})
