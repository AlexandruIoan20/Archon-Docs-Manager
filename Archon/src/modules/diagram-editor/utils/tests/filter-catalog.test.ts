import { describe, expect, it } from 'vitest'
import { filterCatalog } from '../filter-catalog'

const ids = (groups: ReturnType<typeof filterCatalog>): string[] =>
  groups.flatMap((group) => group.entries.map((entry) => entry.id))

describe('filterCatalog', () => {
  it('groups everything, structural first', () => {
    const groups = filterCatalog('all', '')
    expect(groups.map((g) => g.category.id)).toEqual(['structural', 'behavioral'])
    expect(ids(groups)).toHaveLength(14)
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
