import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { createSoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import type { DiagramStoreApi } from '../../store/diagram.store'
import { getStore } from '../../store/store-registry'
import { DiagramEditor } from '../DiagramEditor'

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }
const ids = (store: DiagramStoreApi): string[] => store.getState().nodes.map((n) => n.id)
const selected = (store: DiagramStoreApi): string[] =>
  store
    .getState()
    .nodes.filter((n) => n.selected)
    .map((n) => n.id)

describe('canvas context menus and the node clipboard', () => {
  let tab: EditorTabRef
  let clipboardText = ''

  async function renderDiagram(): Promise<DiagramStoreApi> {
    render(<DiagramEditor tab={tab} />, { wrapper: queryWrapper() })
    await waitFor(() => expect(getStore(tab.tabId)).toBeDefined())
    await waitFor(() => expect(screen.getAllByTestId(/^rf__node-/)).toHaveLength(2))
    return getStore(tab.tabId) as DiagramStoreApi
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    const mock = createSoarApiMock({ platform: 'linux' })
    mock.api.fs.readDiagram.mockResolvedValue(ok(PHISHING))
    window.soar = mock.api
    clipboardText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn((text: string) => {
          clipboardText = text
          return Promise.resolve()
        }),
        readText: vi.fn(() => Promise.resolve(clipboardText))
      }
    })
    const tabId = useEditorStore.getState().openFile('flows/phishing.ardiag', 'ardiag')
    tab = { tabId, filePath: 'flows/phishing.ardiag', kind: 'ardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.soar
  })

  it('adds a node where the canvas was right-clicked', async () => {
    const store = await renderDiagram()
    const pane = document.querySelector('.react-flow__pane') as HTMLElement
    fireEvent.contextMenu(pane, { clientX: 300, clientY: 200 })
    const menu = screen.getByRole('menu', { name: 'Canvas' })
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Add Decision here' }))
    expect(ids(store)).toEqual(['N1', 'N2', 'N3'])
    expect(store.getState().nodes[2]).toMatchObject({ type: 'decision', selected: true })
  })

  it('changes a node type from its submenu, selecting it first', async () => {
    const store = await renderDiagram()
    fireEvent.contextMenu(screen.getByTestId('rf__node-N1'), { clientX: 50, clientY: 50 })
    expect(selected(store)).toEqual(['N1'])
    const menu = screen.getByRole('menu', { name: 'Node N1' })
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Change type' }))
    const submenu = screen.getByRole('menu', { name: 'Change type' })
    expect(within(submenu).getByRole('menuitem', { name: 'Trigger' })).toBeDisabled()
    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Action' }))
    expect(store.getState().nodes[0]?.type).toBe('action')
    act(() => store.getState().undo())
    expect(store.getState().nodes[0]?.type).toBe('trigger')
  })

  it('copies and pastes with the keyboard: new ids, 24px further each time', async () => {
    const store = await renderDiagram()
    act(() => store.getState().selectNodes(['N1', 'N2']))
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true })
    await waitFor(() => expect(clipboardText).toContain('application/x-soar-nodes'))

    fireEvent.keyDown(window, { key: 'v', ctrlKey: true })
    await waitFor(() => expect(ids(store)).toEqual(['N1', 'N2', 'N3', 'N4']))
    expect(selected(store)).toEqual(['N3', 'N4'])
    // The sample's two edges go both ways between N1 and N2: both are internal.
    expect(
      store
        .getState()
        .edges.map((e) => [e.source, e.target])
        .slice(2)
    ).toEqual([
      ['N3', 'N4'],
      ['N4', 'N3']
    ])
    const first = store.getState().nodes[2]?.position

    fireEvent.keyDown(window, { key: 'v', ctrlKey: true })
    await waitFor(() => expect(ids(store)).toHaveLength(6))
    const second = store.getState().nodes[4]?.position
    expect(second).toEqual({ x: (first?.x ?? 0) + 24, y: (first?.y ?? 0) + 24 })
  })

  it('duplicates the selection with Ctrl+D, as one undo step', async () => {
    const store = await renderDiagram()
    act(() => store.getState().selectNodes(['N2']))
    const steps = store.getState().history.past.length
    fireEvent.keyDown(window, { key: 'd', ctrlKey: true })
    expect(ids(store)).toEqual(['N1', 'N2', 'N3'])
    expect(store.getState().history.past).toHaveLength(steps + 1)
  })

  it('selects a node asked for later, in a diagram already open', async () => {
    const store = await renderDiagram()
    act(() => useEditorStore.getState().setPendingSelection(tab.tabId, ['N2']))
    expect(selected(store)).toEqual(['N2'])
    expect(store.getState().selection.nodes).toEqual(['N2'])
    expect(useEditorStore.getState().pendingSelection).toEqual({})
  })
})
