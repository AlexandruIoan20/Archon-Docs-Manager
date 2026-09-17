import { describe, expect, it } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('joins truthy class names with single spaces', () => {
    expect(cn('a', 'b c', 'd')).toBe('a b c d')
  })

  it('skips falsy values', () => {
    const active = false
    expect(cn('base', active && 'active', null, undefined, 0, '', 'end')).toBe('base end')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null)).toBe('')
  })
})
