import { describe, expect, it } from 'vitest'
import { diagramFileSchema } from '../diagram.schema'
import { documentFileSchema } from '../document.schema'
import { workspaceFileSchema } from '../workspace.schema'

const DATES = { created: '2024-01-15T10:00:00Z', lastModified: '2024-01-20T14:30:00Z' }

// Examples from the product specification.
const SPEC_DOCUMENT = {
  version: '1.0.0',
  id: 'uuid-v4',
  title: 'Architecture Overview',
  ...DATES,
  content: 'TipTap JSON content here',
  tags: ['architecture', 'overview'],
  linkedDiagrams: ['uuid-diagram-1', 'uuid-diagram-2']
}

const SPEC_DIAGRAM = {
  version: '1.0.0',
  id: 'uuid-v4',
  title: 'Incident Response Flow',
  type: 'flowchart',
  ...DATES,
  engine: 'react-flow',
  data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
  mermaidSource: null,
  exportedAt: null
}

// Example from plan 09.
const PLAN_DIAGRAM = {
  version: '1.0.0',
  id: '0b8f2a4e-5f1c-4c7a-9d2e-1a3b5c7d9e0f',
  title: 'Phishing triage',
  type: 'activity',
  engine: 'react-flow',
  ...DATES,
  style: { nodeStyle: null, edgeStyle: null },
  data: {
    nodes: [
      {
        id: 'N1',
        type: 'trigger',
        position: { x: 40, y: 250 },
        data: {
          label: '',
          subtitle: '',
          color: '#7C3AED',
          icon: 'zap',
          description: '',
          tags: [],
          retryOnFail: false,
          stroke: null,
          fill: null,
          strokeWidth: null,
          fontSize: null
        }
      }
    ],
    edges: [{ id: 'e-N1-N2', source: 'N1', target: 'N2', label: null }],
    viewport: { x: 0, y: 0, zoom: 1 }
  },
  mermaidSource: null,
  exportedAt: null,
  tags: []
}

describe('document schema', () => {
  it('accepts the specification example, turning string content into a TipTap doc', () => {
    const doc = documentFileSchema.parse(SPEC_DOCUMENT)
    expect(doc.content).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'TipTap JSON content here' }] }
      ]
    })
  })

  it('parses TipTap JSON stored as a string and fills defaults', () => {
    const doc = documentFileSchema.parse({
      version: '1.0.0',
      id: 'd1',
      title: 'Policy',
      ...DATES,
      content: '{"type":"doc","content":[{"type":"heading"}]}'
    })
    expect(doc.content).toEqual({ type: 'doc', content: [{ type: 'heading' }] })
    expect(doc).toMatchObject({ tags: [], linkedDiagrams: [] })
  })

  it('rejects a non-doc root and bad dates', () => {
    expect(documentFileSchema.safeParse({ ...SPEC_DOCUMENT, content: { type: 'p' } }).success).toBe(
      false
    )
    expect(documentFileSchema.safeParse({ ...SPEC_DOCUMENT, created: 'yesterday' }).success).toBe(
      false
    )
  })
})

describe('diagram schema', () => {
  it('accepts the specification and plan examples', () => {
    expect(diagramFileSchema.safeParse(SPEC_DIAGRAM).success).toBe(true)
    const diagram = diagramFileSchema.parse(PLAN_DIAGRAM)
    expect(diagram.data.nodes[0]?.data.color).toBe('#7C3AED')
  })

  it('fills defaults for a minimal diagram and a minimal node', () => {
    const diagram = diagramFileSchema.parse({
      version: '1.0.0',
      id: 'x',
      title: 'Minimal',
      ...DATES,
      data: { nodes: [{ id: 'N1', type: 'action', position: { x: 0, y: 0 } }] }
    })
    expect(diagram).toMatchObject({
      type: 'flowchart',
      engine: 'react-flow',
      style: { nodeStyle: null, edgeStyle: null },
      tags: [],
      mermaidSource: null
    })
    expect(diagram.data.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    expect(diagram.data.nodes[0]?.data).toMatchObject({ label: '', tags: [], retryOnFail: false })
  })

  it('rejects a node without an id', () => {
    const [node] = PLAN_DIAGRAM.data.nodes
    const withoutId = { ...node, id: undefined }
    const result = diagramFileSchema.safeParse({
      ...PLAN_DIAGRAM,
      data: { ...PLAN_DIAGRAM.data, nodes: [withoutId] }
    })
    expect(result.success).toBe(false)
  })

  it('rejects duplicate node ids, unknown types and bad colors', () => {
    const [node] = PLAN_DIAGRAM.data.nodes
    const withNodes = (nodes: unknown[]): boolean =>
      diagramFileSchema.safeParse({ ...PLAN_DIAGRAM, data: { ...PLAN_DIAGRAM.data, nodes } })
        .success
    expect(withNodes([node, node])).toBe(false)
    expect(withNodes([{ ...node, type: 'blob' }])).toBe(false)
    expect(withNodes([{ ...node, data: { color: 'purple' } }])).toBe(false)
    expect(diagramFileSchema.safeParse({ ...PLAN_DIAGRAM, type: 'venn' }).success).toBe(false)
  })

  it('keeps fields it does not know about', () => {
    const [node] = PLAN_DIAGRAM.data.nodes
    const diagram = diagramFileSchema.parse({
      ...PLAN_DIAGRAM,
      data: { ...PLAN_DIAGRAM.data, nodes: [{ ...node, measured: { width: 180 } }] }
    })
    expect(diagram.data.nodes[0]).toHaveProperty('measured', { width: 180 })
  })
})

describe('workspace schema', () => {
  it('only accepts known diagram types as the default', () => {
    const base = {
      version: '1.0.0',
      id: '6f1c2f0e-8f1a-4b8a-9d1e-2b7c4d5e6f70',
      name: 'WS',
      ...DATES
    }
    expect(workspaceFileSchema.parse(base).settings).toEqual({
      theme: 'inherit',
      defaultDiagramType: 'flowchart'
    })
    expect(
      workspaceFileSchema.safeParse({ ...base, settings: { defaultDiagramType: 'venn' } }).success
    ).toBe(false)
  })
})
