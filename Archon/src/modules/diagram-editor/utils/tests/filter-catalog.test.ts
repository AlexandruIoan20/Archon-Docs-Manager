import { describe, expect, it } from 'vitest'
import { filterCatalog } from '../filter-catalog'

const ids = (groups: ReturnType<typeof filterCatalog>): string[] =>
  groups.flatMap((group) => group.entries.map((entry) => entry.id))

describe('filterCatalog', () => {
  it('groups everything, structural first, C4 last', () => {
    const groups = filterCatalog('all', '')
    expect(groups.map((g) => g.category.id)).toEqual(['structural', 'behavioral', 'c4'])
    expect(ids(groups)).toHaveLength(20)
  })

  it('keeps the C4 types in their own category', () => {
    expect(ids(filterCatalog('c4', ''))).toEqual([
      'c4-context',
      'c4-container',
      'c4-component',
      'c4-landscape',
      'c4-dynamic',
      'c4-deployment'
    ])
  })

  it('matches the name, in any case', () => {
    expect(ids(filterCatalog('all', 'SEQ'))).toEqual(['sequence'])
  })

  it('matches the description', () => {
    expect(ids(filterCatalog('all', 'lifelines'))).toEqual(['sequence'])
  })

  it('keeps only the chosen category', () => {
    const groups = filterCatalog('behavioral', '')
    expect(groups.map((g) => g.category.id)).toEqual(['behavioral'])
    expect(ids(groups)).toHaveLength(7)
  })

  it('leaves out empty groups', () => {
    expect(filterCatalog('structural', 'sequence')).toEqual([])
  })
})
