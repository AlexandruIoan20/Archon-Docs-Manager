import { render, screen, waitFor, within } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ArchonDiagram } from '@/core/types'
import { diagramFileSchema, diagramNodeDataSchema } from '@/core/schemas/diagram.schema'
import { queryWrapper } from '@/test/render-with-query'
import { C4_COLORS } from '../../../constants/node-palette'
import { createDiagramStore } from '../../../store/diagram.store'
import { DiagramStoreProvider } from '../../../store/DiagramStoreProvider'
import { fileToGraph } from '../../../utils/graph-mapping'
import { DiagramCanvas } from '../../DiagramCanvas'
import { c4TypeLine } from '../c4-labels'

const C4: ArchonDiagram = diagramFileSchema.parse({
  version: '1.0.0',
  id: 'c4',
  title: 'SOAR containers',
  type: 'c4-container',
  created: '2026-09-01T10:00:00.000Z',
  lastModified: '2026-09-01T10:00:00.000Z',
  data: {
    nodes: [
      {
        id: 'N1',
        type: 'c4-person',
        position: { x: 0, y: 0 },
        data: { label: 'SOC Analyst', description: 'Triages alerts' }
      },
      {
        id: 'N2',
        type: 'c4-database',
        position: { x: 300, y: 0 },
        data: { label: 'Case Store', subtitle: 'PostgreSQL' }
      },
      {
        id: 'N3',
        type: 'c4-system',
        position: { x: 600, y: 0 },
        data: { label: 'SIEM', external: true }
      },
      {
        id: 'N4',
        type: 'c4-boundary',
        position: { x: -40, y: -40 },
        width: 520,
        height: 320,
        zIndex: -1,
        data: { label: 'SOAR Platform', subtitle: 'Software System' }
      }
    ]
  }
})

async function renderCanvas(file: ArchonDiagram): Promise<void> {
  const Wrapper = queryWrapper()
  render(
    <Wrapper>
      <DiagramStoreProvider store={createDiagramStore(fileToGraph(file), file)}>
        <ReactFlowProvider>
          <DiagramCanvas tabId="test" />
        </ReactFlowProvider>
      </DiagramStoreProvider>
    </Wrapper>
  )
  await waitFor(() =>
    expect(screen.getAllByTestId(/^rf__node-/)).toHaveLength(file.data.nodes.length)
  )
}

describe('C4 nodes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('shows the name, the bracketed type line and the description', async () => {
    await renderCanvas(C4)
    const person = screen.getByLabelText('Person SOC Analyst')
    expect(within(person).getByText('[Person]')).toBeInTheDocument()
    expect(within(person).getByText('Triages alerts')).toBeInTheDocument()
    const db = screen.getByLabelText('Database Case Store')
    expect(within(db).getByText('[Container: PostgreSQL]')).toBeInTheDocument()
    expect(db).toHaveAttribute('data-shape', 'cylinder')
  })

  it('greys out external elements and frames with a boundary', async () => {
    await renderCanvas(C4)
    const siem = screen.getByLabelText('Software System SIEM')
    expect(within(siem).getByText('[External Software System]')).toBeInTheDocument()
    expect(siem.style.getPropertyValue('--node-color')).toBe(C4_COLORS.external)
    const boundary = screen.getByLabelText('Boundary SOAR Platform')
    expect(within(boundary).getByText('[Software System]')).toBeInTheDocument()
  })
})

describe('c4TypeLine', () => {
  const data = diagramNodeDataSchema.parse({})

  it('names the element type, with the technology when there is one', () => {
    expect(c4TypeLine('c4-container', data)).toBe('[Container]')
    expect(c4TypeLine('c4-component', { ...data, subtitle: 'Spring Bean' })).toBe(
      '[Component: Spring Bean]'
    )
    expect(c4TypeLine('c4-person', { ...data, external: true })).toBe('[External Person]')
  })
})
