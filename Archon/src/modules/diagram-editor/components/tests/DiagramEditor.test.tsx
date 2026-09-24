import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { AUTOSAVE_DELAY_MS } from '@/shared/hooks/useFileAutosave'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import { createDiagramStore, type DiagramStoreApi } from '../../store/diagram.store'
import { DiagramStoreProvider } from '../../store/DiagramStoreProvider'
import { getStore } from '../../store/store-registry'
import { fileToGraph } from '../../utils/graph-mapping'
import { CanvasOverlays } from '../canvas/CanvasOverlays'
import { DiagramEditor } from '../DiagramEditor'
import { DiagramStatusItems } from '../DiagramStatusItems'

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }
const isDirty = (tabId: string): boolean =>
  useEditorStore.getState().tabs.find((tab) => tab.id === tabId)?.dirty ?? false

describe('DiagramEditor', () => {
  let mock: SoarApiMock
  let tab: EditorTabRef

  const loaded = async (): Promise<DiagramStoreApi> => {
    await waitFor(() => expect(getStore(tab.tabId)).toBeDefined())
    return getStore(tab.tabId) as DiagramStoreApi
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    mock = createSoarApiMock()
    mock.api.fs.readDiagram.mockResolvedValue(ok(PHISHING))
    window.soar = mock.api
    const tabId = useEditorStore.getState().openFile('Playbooks/phishing.soardiag', 'soardiag')
    tab = { tabId, filePath: 'Playbooks/phishing.soardiag', kind: 'soardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.soar
  })

  it('loads the diagram into the tab store and the status bar', async () => {
    render(
      <>
        <DiagramEditor tab={tab} />
        <DiagramStatusItems tab={tab} />
      </>,
      { wrapper: queryWrapper() }
    )
    const store = await loaded()
    expect(store.getState().nodes.map((node) => node.id)).toEqual(['N1', 'N2'])
    expect(await screen.findByText('2 nodes · 2 edges')).toBeInTheDocument()
    expect(screen.getByText('Selection: —')).toBeInTheDocument()
    expect(screen.getByText('87%', { selector: 'span *, span' })).toBeInTheDocument()

    act(() => store.getState().setSelection({ nodes: ['N2'], edges: [] }))
    expect(screen.getByText('Selection: N2')).toBeInTheDocument()
  })

  it('autosaves after a node moves, but not after a selection', async () => {
    render(<DiagramEditor tab={tab} />, { wrapper: queryWrapper() })
    const store = await loaded()

    act(() => store.getState().onNodesChange([{ type: 'select', id: 'N1', selected: true }]))
    expect(isDirty(tab.tabId)).toBe(false)

    act(() =>
      store.getState().onNodesChange([{ type: 'position', id: 'N2', position: { x: 50, y: 300 } }])
    )
    expect(isDirty(tab.tabId)).toBe(true)
    await waitFor(() => expect(mock.api.fs.writeDiagram).toHaveBeenCalledOnce(), {
      timeout: AUTOSAVE_DELAY_MS * 3
    })
    const [relPath, saved] = mock.api.fs.writeDiagram.mock.calls[0] ?? []
    expect(relPath).toBe('Playbooks/phishing.soardiag')
    expect(saved?.data.nodes[1]?.position).toEqual({ x: 50, y: 300 })
    expect(saved?.data.nodes[0]).not.toHaveProperty('selected')
    await waitFor(() => expect(isDirty(tab.tabId)).toBe(false))
  })

  it('zooms in 10% steps and stops at 200%', async () => {
    mock.api.fs.readDiagram.mockResolvedValue(
      ok({ ...PHISHING, data: { ...PHISHING.data, viewport: { x: 0, y: 0, zoom: 1.9 } } })
    )
    render(<DiagramEditor tab={tab} />, { wrapper: queryWrapper() })
    const store = await loaded()
    const zoomIn = await screen.findByRole('button', { name: 'Zoom in' })
    expect(screen.getByRole('button', { name: 'Reset zoom to 100%' })).toHaveTextContent('190%')

    fireEvent.click(zoomIn)
    await waitFor(() => expect(store.getState().viewport.zoom).toBe(2))
    expect(zoomIn).toBeDisabled()
    expect(store.getState().revision).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    await waitFor(() => expect(store.getState().viewport.zoom).toBeCloseTo(1.9))
    expect(zoomIn).toBeEnabled()
  })

  it('keeps each tab’s state apart and across tab switches', async () => {
    const { unmount } = render(<DiagramEditor tab={tab} />, { wrapper: queryWrapper() })
    const first = await loaded()
    act(() => first.getState().setSelection({ nodes: ['N1'], edges: [] }))
    unmount()

    const otherId = useEditorStore.getState().openFile('other.soardiag', 'soardiag')
    render(<DiagramEditor tab={{ ...tab, tabId: otherId, filePath: 'other.soardiag' }} />, {
      wrapper: queryWrapper()
    })
    await waitFor(() => expect(getStore(otherId)).toBeDefined())
    expect(getStore(otherId)).not.toBe(first)
    expect(getStore(tab.tabId)).toBe(first)
    expect(first.getState().selection.nodes).toEqual(['N1'])

    act(() => useEditorStore.getState().close(tab.tabId))
    expect(getStore(tab.tabId)).toBeUndefined()
  })
})

describe('canvas overlays', () => {
  const renderOverlays = (width: number, height: number): void => {
    const store = createDiagramStore(fileToGraph(PHISHING), PHISHING)
    store.getState().setTool('node')
    render(
      <DiagramStoreProvider store={store}>
        <ReactFlowProvider>
          <CanvasOverlays width={width} height={height} />
        </ReactFlowProvider>
      </DiagramStoreProvider>
    )
  }

  it('shows the minimap on a roomy canvas', () => {
    renderOverlays(1200, 800)
    expect(screen.getByLabelText('Diagram overview')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show minimap' })).toBeNull()
    expect(screen.getByRole('status')).toHaveClass('bottom-5')
  })

  it('hides the minimap at 500px, with a button to show it anyway', () => {
    renderOverlays(500, 480)
    expect(screen.queryByLabelText('Diagram overview')).toBeNull()
    expect(screen.getByRole('status')).toHaveClass('bottom-14')
    fireEvent.click(screen.getByRole('button', { name: 'Show minimap' }))
    expect(screen.getByLabelText('Diagram overview')).toBeInTheDocument()
  })
})
