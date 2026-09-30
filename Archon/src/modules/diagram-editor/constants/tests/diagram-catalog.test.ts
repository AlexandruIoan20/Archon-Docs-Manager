import { describe, expect, it } from 'vitest'
import { CATALOG_DIAGRAM_TYPES } from '@/core/schemas/diagram.schema'
import { DIAGRAM_CATALOG } from '../diagram-catalog'
import { SKETCHES } from '../diagram-sketches'
import { categoryCounts } from '../../utils/filter-catalog'

describe('diagram catalog', () => {
  it('holds each UML 2.5 and C4 type once', () => {
    expect(DIAGRAM_CATALOG.map((entry) => entry.id).sort()).toEqual(
      [...CATALOG_DIAGRAM_TYPES].sort()
    )
  })

  it('names every type once', () => {
    const names = DIAGRAM_CATALOG.map((entry) => entry.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has a sketch for every type', () => {
    for (const { id } of DIAGRAM_CATALOG) expect(SKETCHES[id].length).toBeGreaterThan(0)
  })

  it('counts 7 structural, 7 behavioral, 6 C4, 20 in all', () => {
    expect(categoryCounts()).toEqual({ all: 20, structural: 7, behavioral: 7, c4: 6 })
  })
})
