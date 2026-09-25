import type { ArchonDiagram } from '@/core/types'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'

/** A small diagram: two nodes, two edges, a saved viewport and a field from the future. */
export const PHISHING: ArchonDiagram = diagramFileSchema.parse({
  version: '1.0.0',
  id: 'diag-1',
  title: 'Phishing triage',
  created: '2026-09-01T10:00:00.000Z',
  lastModified: '2026-09-01T10:00:00.000Z',
  tags: ['ir'],
  data: {
    nodes: [
      { id: 'N1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Alert' } },
      {
        id: 'N2',
        type: 'action',
        position: { x: 0, y: 120 },
        data: { label: 'Contain Host', color: '#4F8EF7' },
        futureField: { keep: true }
      }
    ],
    edges: [
      { id: 'E1', source: 'N1', target: 'N2', label: 'yes' },
      { id: 'E2', source: 'N2', target: 'N1' }
    ],
    viewport: { x: 10, y: -20, zoom: 0.87 }
  }
})
