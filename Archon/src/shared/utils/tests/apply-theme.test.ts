import { describe, expect, it } from 'vitest'
import { applyTheme, readTitleBarColors, resolveTheme } from '../apply-theme'

describe('resolveTheme', () => {
  it('keeps explicit themes and follows the OS for `system`', () => {
    expect(resolveTheme('light', 'dark')).toBe('light')
    expect(resolveTheme('system', 'light')).toBe('light')
    expect(resolveTheme('system', undefined)).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('sets the theme attribute and color scheme', () => {
    const root = document.createElement('div')
    applyTheme('light', '#4F8EF7', root)
    expect(root.dataset.theme).toBe('light')
    expect(root.style.colorScheme).toBe('light')
  })

  it('overrides the accent, and clears the override for the default accent', () => {
    const root = document.createElement('div')
    applyTheme('dark', '#F59E0B', root)
    expect(root.style.getPropertyValue('--accent')).toBe('#F59E0B')
    applyTheme('dark', '#4F8EF7', root)
    expect(root.style.getPropertyValue('--accent')).toBe('')
  })
})

describe('readTitleBarColors', () => {
  it('reads hex theme colors', () => {
    const root = document.createElement('div')
    root.style.setProperty('--bg', '#f8fafc')
    root.style.setProperty('--text2', '#64748b')
    document.body.append(root)
    expect(readTitleBarColors(root)).toEqual({ color: '#f8fafc', symbolColor: '#64748b' })
    root.remove()
  })

  it('returns null when the colors are not plain hex', () => {
    const root = document.createElement('div')
    root.style.setProperty('--bg', 'rgb(0 0 0)')
    expect(readTitleBarColors(root)).toBeNull()
  })
})
