import { describe, expect, it } from 'vitest'
import { hexToRgba } from '../color'

describe('hexToRgba', () => {
  it('converts 6- and 3-digit hex colors', () => {
    expect(hexToRgba('#2563EB', 0.45)).toBe('rgba(37, 99, 235, 0.45)')
    expect(hexToRgba('7c3aed', 1)).toBe('rgba(124, 58, 237, 1)')
    expect(hexToRgba('#fff', 0.22)).toBe('rgba(255, 255, 255, 0.22)')
  })

  it('keeps alpha within 0–1', () => {
    expect(hexToRgba('#000000', 2)).toBe('rgba(0, 0, 0, 1)')
    expect(hexToRgba('#000000', -1)).toBe('rgba(0, 0, 0, 0)')
  })

  it('rejects anything else', () => {
    expect(() => hexToRgba('red', 1)).toThrow('Not a hex color')
    expect(() => hexToRgba('#12345', 1)).toThrow()
  })
})
