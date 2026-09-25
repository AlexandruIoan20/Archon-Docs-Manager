import { describe, expect, it } from 'vitest'
import {
  assertNoConflicts,
  getShortcut,
  normalizeCombo,
  SHORTCUTS,
  type ShortcutDef
} from '../shortcuts'

const def = (id: string, scope: ShortcutDef['scope'], keys: string[]): ShortcutDef => ({
  id,
  scope,
  keys,
  description: id
})

describe('shortcut registry', () => {
  it('has no conflicts and unique ids', () => {
    expect(() => assertNoConflicts(SHORTCUTS)).not.toThrow()
    const ids = SHORTCUTS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('throws for the same combo twice in a scope, whatever the spelling', () => {
    expect(() =>
      assertNoConflicts([
        def('a', 'diagram', ['mod+shift+z']),
        def('b', 'diagram', ['Shift+Mod+Z'])
      ])
    ).toThrow('Shortcut conflict: a and b')
  })

  it('throws when a global shortcut takes a combo of any scope', () => {
    expect(() =>
      assertNoConflicts([def('a', 'global', ['mod+k']), def('b', 'tree', ['mod+k'])])
    ).toThrow()
  })

  it('allows one combo in two editor scopes, and listed-only entries', () => {
    expect(() =>
      assertNoConflicts([
        def('a', 'tree', ['delete']),
        def('b', 'diagram', ['delete']),
        { ...def('c', 'global', ['delete']), listedOnly: true }
      ])
    ).not.toThrow()
  })

  it('normalizes the modifier order', () => {
    expect(normalizeCombo('Shift+Alt+Mod+B')).toBe('mod+alt+shift+b')
  })

  it('finds a shortcut by id', () => {
    expect(getShortcut('search.open').keys).toEqual(['mod+k'])
  })
})
