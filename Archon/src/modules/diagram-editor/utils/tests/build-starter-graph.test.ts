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

  it('is valid diagram data', () => {
    expect(() => diagramDataSchema.parse(buildStarterGraph('class'))).not.toThrow()
  })
})
