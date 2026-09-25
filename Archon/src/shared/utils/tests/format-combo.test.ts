import { describe, expect, it } from 'vitest'
import { ariaKeyShortcut, formatCombo, platformFromUserAgent } from '../platform'

describe('formatCombo', () => {
  it('uses symbols on macOS, in the Apple order', () => {
    expect(formatCombo('darwin', 'mod+shift+z')).toBe('⇧⌘Z')
    expect(formatCombo('darwin', 'mod+alt+b')).toBe('⌥⌘B')
    expect(formatCombo('darwin', 'ctrl+tab')).toBe('⌃Tab')
  })

  it('spells the keys out elsewhere', () => {
    expect(formatCombo('win32', 'mod+shift+z')).toBe('Ctrl+Shift+Z')
    expect(formatCombo('linux', 'delete')).toBe('Del')
    expect(formatCombo(undefined, 'mod+/')).toBe('Ctrl+/')
  })

  it('writes aria-keyshortcuts values', () => {
    expect(ariaKeyShortcut('darwin', 'mod+k')).toBe('Meta+K')
    expect(ariaKeyShortcut('linux', 'mod+alt+b')).toBe('Control+Alt+B')
  })

  it('reads the OS from the user agent', () => {
    expect(platformFromUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('darwin')
    expect(platformFromUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('win32')
    expect(platformFromUserAgent('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux')
  })
})
