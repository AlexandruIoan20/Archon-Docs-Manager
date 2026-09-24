import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { NodeStyle, SoarDiagram } from '@/core/types'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { queryWrapper } from '@/test/render-with-query'
import { useIsHotEdge } from '../../../hooks/useHotEdges'
import { createDiagramStore, type DiagramStoreApi } from '../../../store/diagram.store'
import { DiagramStoreProvider } from '../../../store/DiagramStoreProvider'
import { fileToGraph } from '../../../utils/graph-mapping'
import { DiagramCanvas } from '../../DiagramCanvas'

const node = (id: string, type: string, label: string, subtitle = ''): object => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label, subtitle }
})

const diagram = (nodeStyle: NodeStyle | null = null): SoarDiagram =>
  diagramFileSchema.parse({
    version: '1.0.0',
    id: 'd1',
    title: 'Triage',
    created: '2026-09-01T10:00:00.000Z',
    lastModified: '2026-09-01T10:00:00.000Z',
    style: { nodeStyle },
    data: {
      nodes: [
        node('N1', 'trigger', 'Phishing report', 'Mailbox'),
        node('N2', 'action', 'Contain Host', 'EDR'),
        node('N3', 'decision', 'Malicious?'),
        node('N4', 'integration', 'Query EDR', 'CrowdStrike'),
        node('N5', 'element', 'Asset', 'CMDB')
      ],
      edges: [
        { id: 'E1', source: 'N1', target: 'N2' },
        { id: 'E2', source: 'N3', target: 'N4' }
      ]
    }
  })

async function renderCanvas(file: SoarDiagram): Promise<DiagramStoreApi> {
  const store = createDiagramStore(fileToGraph(file), file)
  const Wrapper = queryWrapper()
  render(
    <Wrapper>
      <DiagramStoreProvider store={store}>
        <ReactFlowProvider>
          <DiagramCanvas />
        </ReactFlowProvider>
      </DiagramStoreProvider>
    </Wrapper>
  )
  // React Flow hands its nodes to the renderer in an effect.
  await waitFor(() =>
    expect(screen.getAllByTestId(/^rf__node-/)).toHaveLength(file.data.nodes.length)
  )
  return store
}

// React Flow keeps nodes `visibility: hidden` until it has measured them (never, in
// jsdom), which leaves them without an accessible name: find them by their label.
const nodeGroup = (name: string): HTMLElement => screen.getByLabelText(name)

describe('SOAR nodes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('renders every node type with its title, subtitle and label for assistive tech', async () => {
    await renderCanvas(diagram())
    expect(within(nodeGroup('Trigger Phishing report')).getByText('Mailbox')).toBeInTheDocument()
    expect(within(nodeGroup('Action Contain Host')).getByText('EDR')).toBeInTheDocument()
    expect(within(nodeGroup('Integration Query EDR')).getByText('CrowdStrike')).toBeInTheDocument()
    expect(within(nodeGroup('Element Asset')).getByText('CMDB')).toBeInTheDocument()
    expect(nodeGroup('Decision Malicious?')).toBeInTheDocument()
  })

  it('draws decisions as a diamond and the rest as rectangles', async () => {
    await renderCanvas(diagram())
    expect(nodeGroup('Decision Malicious?')).toHaveClass('soar-node--diamond')
    expect(nodeGroup('Decision Malicious?')).toHaveAttribute('data-shape', 'diamond')
    expect(nodeGroup('Action Contain Host')).not.toHaveClass('soar-node--diamond')
  })

  it('uses the kind color and the diagram skin', async () => {
    await renderCanvas(diagram('solid'))
    const action = nodeGroup('Action Contain Host')
    expect(action).toHaveClass('soar-node--solid')
    expect(action.style.getPropertyValue('--node-color')).toBe('#2563EB')
    expect(nodeGroup('Trigger Phishing report').style.getPropertyValue('--node-color')).toBe(
      '#7C3AED'
    )
  })

  it('shows the selection chrome only on a selected node, and deletes from it', async () => {
    const store = await renderCanvas(diagram())
    expect(screen.queryByLabelText('Delete N2')).toBeNull()

    act(() => store.getState().onNodesChange([{ type: 'select', id: 'N2', selected: true }]))
    const action = nodeGroup('Action Contain Host')
    expect(within(action).getByText('N2')).toBeInTheDocument()
    expect(screen.queryByLabelText('Delete N1')).toBeNull()

    fireEvent.click(within(action).getByLabelText('Delete N2'))
    expect(store.getState().nodes.map((n) => n.id)).toEqual(['N1', 'N3', 'N4', 'N5'])
    // The edge attached to N2 goes with it.
    expect(store.getState().edges.map((e) => e.id)).toEqual(['E2'])
    expect(store.getState().revision).toBe(1)
  })
})

describe('useIsHotEdge', () => {
  it('is hot while one of its ends is selected', () => {
    const file = diagram()
    const store = createDiagramStore(fileToGraph(file), file)
    const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element => (
      <DiagramStoreProvider store={store}>{children}</DiagramStoreProvider>
    )
    const { result } = renderHook(() => useIsHotEdge('N1', 'N2'), { wrapper })
    expect(result.current).toBe(false)
    act(() => store.getState().setSelection({ nodes: ['N2'], edges: [] }))
    expect(result.current).toBe(true)
    act(() => store.getState().setSelection({ nodes: ['N3'], edges: [] }))
    expect(result.current).toBe(false)
  })
})
