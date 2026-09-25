import { describe, expect, it } from 'vitest'
import { UML_DIAGRAM_TYPES } from '@/core/schemas/diagram.schema'
import { DIAGRAM_CATALOG } from '../diagram-catalog'
import { SKETCHES } from '../diagram-sketches'
import { categoryCounts } from '../../utils/filter-catalog'

describe('diagram catalog', () => {
  it('holds each UML 2.5 type once', () => {
    expect(DIAGRAM_CATALOG.map((entry) => entry.id).sort()).toEqual([...UML_DIAGRAM_TYPES].sort())
  })

  it('has a sketch for every type', () => {
    for (const { id } of DIAGRAM_CATALOG) expect(SKETCHES[id].length).toBeGreaterThan(0)
  })

  it('counts 7 structural, 7 behavioral, 14 in all', () => {
    expect(categoryCounts()).toEqual({ all: 14, structural: 7, behavioral: 7 })
  })
})
