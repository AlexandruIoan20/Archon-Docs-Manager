import { describe, expect, it } from 'vitest'
import type { DiagramEdgeInput, DiagramNodeInput, ArchonDiagram } from '@/core/types'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { buildStarterGraph } from '../../utils/build-starter-graph'
import { serializeXmi, supportsXmi } from '../xmi/serialize-xmi'

function diagram(
  type: ArchonDiagram['type'],
  extra: { nodes?: DiagramNodeInput[]; edges?: DiagramEdgeInput[] } = {}
): ArchonDiagram {
  const graph = buildStarterGraph(type as never)
  return diagramFileSchema.parse({
    version: '1.0.0',
    id: `diag-${type}`,
    title: `Sample ${type}`,
    type,
    created: '2026-09-24T10:00:00.000Z',
    lastModified: '2026-09-24T10:00:00.000Z',
    data: { ...graph, ...extra }
  })
}

const parse = (xml: string): Document => new DOMParser().parseFromString(xml, 'application/xml')

describe('serializeXmi', () => {
  it.each(['class', 'activity', 'state'] as const)('writes well-formed XMI for %s', (type) => {
    const xml = serializeXmi(diagram(type))
    expect(parse(xml).getElementsByTagName('parsererror')).toHaveLength(0)
    expect(xml).toMatchSnapshot()
  })

  it('escapes names and keeps descriptions as comments', () => {
    const d = diagram('class')
    d.data.nodes[0]!.data.label = 'Alert <"P1"> & more'
    d.data.nodes[0]!.data.description = 'Raised by the SIEM'
    const xml = serializeXmi(d)
    expect(xml).toContain('name="Alert &lt;&quot;P1&quot;&gt; &amp; more"')
    expect(xml).toContain('body="Raised by the SIEM"')
    expect(parse(xml).getElementsByTagName('parsererror')).toHaveLength(0)
  })

  it('leaves free shapes and text out, with their edges', () => {
    const d = diagram('state', {
      nodes: [
        ...buildStarterGraph('state').nodes,
        { id: 'N3', type: 'text', position: { x: 0, y: 0 }, data: { label: 'note' } }
      ],
      edges: [
        { id: 'E1', source: 'N1', target: 'N2' },
        { id: 'E2', source: 'N2', target: 'N3' }
      ]
    })
    const xml = serializeXmi(d)
    expect(xml).not.toContain('_N3')
    expect(xml).not.toContain('_E2')
  })
})

describe('supportsXmi', () => {
  it('is for class, activity and state canvas diagrams only', () => {
    expect(supportsXmi({ type: 'class', engine: 'react-flow' })).toBe(true)
    expect(supportsXmi({ type: 'sequence', engine: 'react-flow' })).toBe(false)
    expect(supportsXmi({ type: 'flowchart', engine: 'react-flow' })).toBe(false)
    expect(supportsXmi({ type: 'state', engine: 'mermaid' })).toBe(false)
  })
})
