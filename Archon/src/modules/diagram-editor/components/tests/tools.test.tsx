import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { useEditorStore, useStatusStore, useUiStore } from '@/store'
import { TitleBarDensityContext } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { createSoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import type { DiagramStoreApi } from '../../store/diagram.store'
import { getStore } from '../../store/store-registry'
import { DiagramEditor } from '../DiagramEditor'
import { DiagramToolbar } from '../toolbar/DiagramToolbar'

const initial = {
  editor: useEditorStore.getState(),
  ui: useUiStore.getState(),
  status: useStatusStore.getState()
}
const toast = (): string | undefined => useUiStore.getState().toast?.message
const nodeIds = (store: DiagramStoreApi): string[] => store.getState().nodes.map((n) => n.id)
const nodeEl = (id: string): HTMLElement => screen.getByTestId(`rf__node-${id}`)

describe('diagram tools', () => {
  let tab: EditorTabRef

  async function renderDiagram(density: 'full' | 'minimal' = 'full'): Promise<DiagramStoreApi> {
    render(
      <TitleBarDensityContext.Provider value={density}>
        <DiagramToolbar tab={tab} />
        <DiagramEditor tab={tab} />
      </TitleBarDensityContext.Provider>,
      { wrapper: queryWrapper() }
    )
    await waitFor(() => expect(getStore(tab.tabId)).toBeDefined())
    await screen.findByRole('toolbar', { name: 'Canvas tools' })
    await waitFor(() => expect(screen.getAllByTestId(/^rf__node-/)).toHaveLength(2))
    return getStore(tab.tabId) as DiagramStoreApi
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    useStatusStore.setState(initial.status, true)
    const mock = createSoarApiMock({ platform: 'linux' })
    mock.api.fs.readDiagram.mockResolvedValue(ok(PHISHING))
    window.soar = mock.api
    const tabId = useEditorStore.getState().openFile('flows/phishing.ardiag', 'ardiag')
    tab = { tabId, filePath: 'flows/phishing.ardiag', kind: 'ardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.soar
  })

  it('places a node with Add node, selects it and returns to Select', async () => {
    const store = await renderDiagram()
    fireEvent.click(screen.getByRole('button', { name: 'Add node (N): Action' }))
    expect(store.getState().tool).toBe('node')
    expect(screen.getByRole('status')).toHaveTextContent('Click on the canvas to place a node')

    const pane = document.querySelector('.react-flow__pane') as HTMLElement
    fireEvent.click(pane, { clientX: 300, clientY: 200 })

    expect(nodeIds(store)).toEqual(['N1', 'N2', 'N3'])
    expect(store.getState().nodes.at(-1)).toMatchObject({ type: 'action', selected: true })
    expect(store.getState().tool).toBe('select')
    expect(toast()).toBe('Node added')
  })

  it('picks the node type from the Add node menu', async () => {
    const store = await renderDiagram()
    fireEvent.click(screen.getByRole('button', { name: 'Node type' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Decision' }))
    expect(store.getState()).toMatchObject({ tool: 'node', nodeKind: 'decision' })
  })

  it('connects two nodes in two clicks, with a hint and a status', async () => {
    const store = await renderDiagram()
    // The fixture already links N2 → N1: drop it, so that edge can be drawn again.
    act(() => store.getState().onEdgesChange([{ type: 'remove', id: 'E2' }]))
    fireEvent.keyDown(window, { key: 'c' })
    expect(screen.getByRole('status')).toHaveTextContent('Click a source node to start an edge')

    fireEvent.click(nodeEl('N2'))
    expect(store.getState().connectFrom).toBe('N2')
    expect(screen.getByRole('status')).toHaveTextContent('Now click the target node')
    expect(useStatusStore.getState().statusText).toBe('Connecting…')

    fireEvent.click(nodeEl('N1'))
    expect(store.getState().edges.at(-1)).toMatchObject({ source: 'N2', target: 'N1' })
    expect(store.getState().tool).toBe('select')
    expect(toast()).toBe('Edge created')
    expect(useStatusStore.getState().statusText).toBe('Ready')
  })

  it('cancels a connection by clicking the source again or with Escape', async () => {
    const store = await renderDiagram()
    fireEvent.keyDown(window, { key: 'c' })
    fireEvent.click(nodeEl('N1'))
    fireEvent.click(nodeEl('N1'))
    expect(store.getState().connectFrom).toBeNull()
    fireEvent.click(nodeEl('N1'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(store.getState().connectFrom).toBeNull()
  })

  it('deletes the selection and brings it back with Ctrl+Z', async () => {
    const store = await renderDiagram()
    act(() => store.getState().onNodesChange([{ type: 'select', id: 'N2', selected: true }]))
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(nodeIds(store)).toEqual(['N1'])
    expect(store.getState().edges).toEqual([])
    expect(toast()).toBe('Node deleted — Ctrl+Z to undo')

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(nodeIds(store)).toEqual(['N1', 'N2'])
    expect(store.getState().edges.map((e) => e.id)).toEqual(['E1', 'E2'])

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(toast()).toBe('Nothing to undo')
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(nodeIds(store)).toEqual(['N1'])
  })

  it('switches tools with single-key shortcuts, but not while typing', async () => {
    const store = await renderDiagram()
    fireEvent.keyDown(window, { key: 'h' })
    expect(store.getState().tool).toBe('pan')
    const input = screen.getByRole('textbox', { name: 'Font size' })
    fireEvent.keyDown(input, { key: 'r' })
    expect(store.getState().tool).toBe('pan')
  })

  it('folds Text, Rectangle and Ellipse into „⋯” in the minimal title bar', async () => {
    const store = await renderDiagram('minimal')
    const tools = screen.getByRole('toolbar', { name: 'Canvas tools' })
    expect(within(tools).queryByRole('button', { name: 'Rectangle (R)' })).toBeNull()

    fireEvent.click(within(tools).getByRole('button', { name: 'More tools' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Rectangle/ }))
    expect(store.getState().tool).toBe('rect')
    expect(within(tools).getByRole('button', { name: 'More tools' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Style' })).toBeInTheDocument()
  })

  it('undo and redo buttons follow the history', async () => {
    const store = await renderDiagram()
    const undo = screen.getByRole('button', { name: /^Undo/ })
    expect(undo).toBeDisabled()
    act(() => void store.getState().addNode('trigger', { x: 0, y: 0 }))
    expect(undo).toBeEnabled()
    fireEvent.click(undo)
    expect(nodeIds(store)).toEqual(['N1', 'N2'])
    expect(screen.getByRole('button', { name: /^Redo/ })).toBeEnabled()
  })
})
