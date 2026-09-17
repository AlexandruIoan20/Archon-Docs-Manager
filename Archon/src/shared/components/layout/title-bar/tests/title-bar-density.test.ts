import { describe, expect, it } from 'vitest'
import { resolveTitleBarDensity } from '../title-bar-density'

describe('resolveTitleBarDensity', () => {
  it('maps widths to densities on first measurement', () => {
    expect(resolveTitleBarDensity(1400)).toBe('full')
    expect(resolveTitleBarDensity(1000)).toBe('full')
    expect(resolveTitleBarDensity(999)).toBe('compact')
    expect(resolveTitleBarDensity(700)).toBe('compact')
    expect(resolveTitleBarDensity(699)).toBe('minimal')
  })

  it('drops a level as soon as the width crosses the threshold', () => {
    expect(resolveTitleBarDensity(999, 'full')).toBe('compact')
    expect(resolveTitleBarDensity(650, 'full')).toBe('minimal')
    expect(resolveTitleBarDensity(699, 'compact')).toBe('minimal')
  })

  it('needs the hysteresis margin to move back up', () => {
    let density = resolveTitleBarDensity(999, 'full')
    expect(density).toBe('compact')
    density = resolveTitleBarDensity(1010, density)
    expect(density).toBe('compact')
    density = resolveTitleBarDensity(1024, density)
    expect(density).toBe('full')

    expect(resolveTitleBarDensity(710, 'minimal')).toBe('minimal')
    expect(resolveTitleBarDensity(724, 'minimal')).toBe('compact')
  })

  it('jumps several levels up when the margin allows it', () => {
    expect(resolveTitleBarDensity(1300, 'minimal')).toBe('full')
    expect(resolveTitleBarDensity(1010, 'minimal')).toBe('compact')
  })

  it('keeps the previous density while the bar is not measured', () => {
    expect(resolveTitleBarDensity(0)).toBe('full')
    expect(resolveTitleBarDensity(0, 'minimal')).toBe('minimal')
  })
})
