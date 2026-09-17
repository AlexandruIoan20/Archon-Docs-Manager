import { describe, expect, it } from 'vitest'
import type { PanelPreference } from '@/core/types'
import { resolvePanelLayout } from '../panel-layout'

const sidebar = (patch: Partial<PanelPreference> = {}): PanelPreference => ({
  visible: true,
  width: 260,
  overlayOpen: false,
  ...patch
})
const inspector = (patch: Partial<PanelPreference> = {}): PanelPreference => ({
  visible: true,
  width: 240,
  overlayOpen: false,
  ...patch
})

function modes(input: Parameters<typeof resolvePanelLayout>[0]): [string, string] {
  const layout = resolvePanelLayout(input)
  return [layout.sidebar.mode, layout.inspector.mode]
}

describe('resolvePanelLayout', () => {
  it('docks both panels at 1440 with default widths', () => {
    expect(modes({ width: 1440, sidebar: sidebar(), inspector: inspector() })).toEqual([
      'docked',
      'docked'
    ])
  })

  it('docks the inspector from 1100 and the sidebar from 900', () => {
    expect(modes({ width: 1100, sidebar: sidebar(), inspector: inspector() })).toEqual([
      'docked',
      'docked'
    ])
    expect(modes({ width: 1099, sidebar: sidebar(), inspector: inspector() })).toEqual([
      'docked',
      'hidden'
    ])
    expect(modes({ width: 900, sidebar: sidebar(), inspector: inspector() })[0]).toBe('docked')
    expect(modes({ width: 899, sidebar: sidebar(), inspector: inspector() })).toEqual([
      'hidden',
      'hidden'
    ])
  })

  it('hides the inspector sooner when the sidebar is widened', () => {
    const wide = sidebar({ width: 420 })
    expect(modes({ width: 1260, sidebar: wide, inspector: inspector() })[1]).toBe('docked')
    expect(modes({ width: 1259, sidebar: wide, inspector: inspector() })[1]).toBe('hidden')
  })

  it('keeps the inspector docked down to 840 when the user hid the sidebar', () => {
    const closed = sidebar({ visible: false })
    expect(modes({ width: 840, sidebar: closed, inspector: inspector() })).toEqual([
      'hidden',
      'docked'
    ])
    expect(modes({ width: 839, sidebar: closed, inspector: inspector() })[1]).toBe('hidden')
  })

  it('docks a panel that fits even if an overlay was requested', () => {
    const layout = resolvePanelLayout({
      width: 1440,
      sidebar: sidebar({ overlayOpen: true }),
      inspector: inspector()
    })
    expect(layout.sidebar.mode).toBe('docked')
  })

  it('shows a requested overlay only for a visible panel that does not fit', () => {
    expect(
      modes({ width: 1000, sidebar: sidebar(), inspector: inspector({ overlayOpen: true }) })
    ).toEqual(['docked', 'overlay'])
    expect(
      modes({
        width: 1000,
        sidebar: sidebar(),
        inspector: inspector({ visible: false, overlayOpen: true })
      })
    ).toEqual(['docked', 'hidden'])
  })

  it('keeps only the last requested overlay', () => {
    const both = {
      width: 720,
      sidebar: sidebar({ overlayOpen: true }),
      inspector: inspector({ overlayOpen: true })
    }
    expect(modes({ ...both, lastOverlay: 'sidebar' })).toEqual(['overlay', 'hidden'])
    expect(modes({ ...both, lastOverlay: 'inspector' })).toEqual(['hidden', 'overlay'])
  })

  it('reports whether each panel fits, independent of visibility', () => {
    const layout = resolvePanelLayout({
      width: 1000,
      sidebar: sidebar(),
      inspector: inspector({ visible: false })
    })
    expect(layout.sidebar.fits).toBe(true)
    expect(layout.inspector.fits).toBe(false)
    expect(layout.inspector.width).toBe(240)
  })
})
