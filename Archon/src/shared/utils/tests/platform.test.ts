import { describe, expect, it } from 'vitest'
import { formatShortcut, modKeyLabel } from '../platform'

describe('modKeyLabel', () => {
  it('uses ⌘ on macOS and Ctrl elsewhere', () => {
    expect(modKeyLabel('darwin')).toBe('⌘')
    expect(modKeyLabel('win32')).toBe('Ctrl')
    expect(modKeyLabel('linux')).toBe('Ctrl')
    expect(modKeyLabel(undefined)).toBe('Ctrl')
  })
})

describe('formatShortcut', () => {
  it('joins the modifier the way each platform writes it', () => {
    expect(formatShortcut('darwin', 'Z')).toBe('⌘Z')
    expect(formatShortcut('win32', 'Z')).toBe('Ctrl+Z')
  })
})
