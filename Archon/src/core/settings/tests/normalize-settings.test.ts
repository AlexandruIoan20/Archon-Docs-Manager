import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings, normalizeSettings, snapUiZoom } from '../normalize-settings'

describe('normalizeSettings', () => {
  it('returns the defaults for anything that is not an object', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('dark')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings([])).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values and replaces invalid ones field by field', () => {
    const settings = normalizeSettings({
      appearance: { theme: 'light', accent: '#22c55e', nodeStyle: 'neon', uiZoom: 'big' },
      layout: { sidebar: { visible: false, width: 999 }, inspector: { width: 10 } },
      window: { bounds: { x: 10, y: 20, width: 800, height: 600 }, maximized: 'yes' },
      recentWorkspaces: ['/a', 42, '/b', '/a', ''],
      session: 'nope',
      unknownKey: true
    })

    expect(settings.appearance).toEqual({
      theme: 'light',
      accent: '#22C55E',
      nodeStyle: 'card',
      edgeStyle: 'curved',
      uiZoom: 1
    })
    expect(settings.layout).toEqual({
      sidebar: { visible: false, width: 420 },
      inspector: { visible: true, width: 220 }
    })
    expect(settings.window).toEqual({
      bounds: { x: 10, y: 20, width: 800, height: 600 },
      maximized: false
    })
    expect(settings.recentWorkspaces).toEqual(['/a', '/b'])
    expect(settings.session).toEqual({})
    expect(settings).not.toHaveProperty('unknownKey')
  })

  it('drops window bounds that are incomplete or empty', () => {
    expect(
      normalizeSettings({ window: { bounds: { x: 0, y: 0, width: 800 } } }).window.bounds
    ).toBe(null)
    expect(
      normalizeSettings({ window: { bounds: { x: 0, y: 0, width: 0, height: 600 } } }).window.bounds
    ).toBe(null)
  })

  it('keeps at most ten recent workspaces', () => {
    const paths = Array.from({ length: 14 }, (_, i) => `/ws/${i}`)
    expect(normalizeSettings({ recentWorkspaces: paths }).recentWorkspaces).toHaveLength(10)
  })
})

describe('snapUiZoom', () => {
  it('snaps to the closest step', () => {
    expect(snapUiZoom(1.2)).toBe(1.25)
    expect(snapUiZoom(3)).toBe(1.5)
    expect(snapUiZoom(0.1)).toBe(0.8)
    expect(snapUiZoom(Number.NaN)).toBe(1)
  })
})

describe('mergeSettings', () => {
  it('merges nested objects key by key', () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, {
      appearance: { theme: 'system' },
      layout: { inspector: { width: 300 } }
    })
    expect(merged.appearance).toEqual({ ...DEFAULT_SETTINGS.appearance, theme: 'system' })
    expect(merged.layout.inspector).toEqual({ visible: true, width: 300 })
    expect(merged.layout.sidebar).toEqual(DEFAULT_SETTINGS.layout.sidebar)
  })

  it('replaces arrays and accepts null bounds', () => {
    const withData = mergeSettings(DEFAULT_SETTINGS, {
      recentWorkspaces: ['/a', '/b'],
      window: { bounds: { x: 1, y: 2, width: 3, height: 4 } }
    })
    const merged = mergeSettings(withData, { recentWorkspaces: ['/c'], window: { bounds: null } })
    expect(merged.recentWorkspaces).toEqual(['/c'])
    expect(merged.window.bounds).toBeNull()
  })

  it('validates the patched values', () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, {
      appearance: { theme: 'sepia' as never, uiZoom: 1.3 }
    })
    expect(merged.appearance.theme).toBe('dark')
    expect(merged.appearance.uiZoom).toBe(1.25)
  })

  it('does not mutate the current settings', () => {
    const current = structuredClone(DEFAULT_SETTINGS)
    mergeSettings(current, { layout: { sidebar: { visible: false } } })
    expect(current).toEqual(DEFAULT_SETTINGS)
  })
})
