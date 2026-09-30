import { describe, expect, it } from 'vitest'
import { diagramDataSchema } from '@/core/schemas/diagram.schema'
import { buildStarterGraph } from '../build-starter-graph'

describe('buildStarterGraph', () => {
  it('places N1 and N2 on the diagonal, linked N1 → N2', () => {
    const { nodes, edges } = buildStarterGraph('state')
    expect(nodes.map((n) => [n.id, n.position])).toEqual([
      ['N1', { x: 180, y: 260 }],
      ['N2', { x: 480, y: 330 }]
    ])
    expect(edges).toEqual([{ id: 'E1', source: 'N1', target: 'N2' }])
  })

  it('uses the starters of the type', () => {
    const { nodes } = buildStarterGraph('state')
    expect(nodes.map((n) => n.data?.label)).toEqual(['New', 'Contained'])
  })

  it('falls back to „<Type> A” / „<Type> B”', () => {
    const { nodes } = buildStarterGraph('deployment')
    expect(nodes.map((n) => n.data?.label)).toEqual(['Deployment A', 'Deployment B'])
  })

  it('starts a C4 diagram with C4 elements and a described relationship', () => {
    const { nodes, edges } = buildStarterGraph('c4-context')
    expect(nodes.map((n) => n.type)).toEqual(['c4-person', 'c4-system'])
    expect(edges[0]).toMatchObject({ label: 'Uses' })
    expect(() => diagramDataSchema.parse(buildStarterGraph('c4-container'))).not.toThrow()
  })

  it('is valid diagram data', () => {
    expect(() => diagramDataSchema.parse(buildStarterGraph('class'))).not.toThrow()
  })
})
