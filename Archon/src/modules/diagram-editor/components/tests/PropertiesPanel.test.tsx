import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import type { DiagramStoreApi } from '../../store/diagram.store'
import type { FlowNode } from '../../utils/graph-mapping'
import { getStore } from '../../store/store-registry'
import { DiagramEditor } from '../DiagramEditor'
import { PropertiesPanel } from '../PropertiesPanel'

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }
const panel = (): HTMLElement => screen.getByTestId('panel')
const node = (store: DiagramStoreApi, id: string): FlowNode | undefined =>
  store.getState().nodes.find((n) => n.id === id)
const steps = (store: DiagramStoreApi): number => store.getState().history.past.length

describe('PropertiesPanel', () => {
  let mock: ArchonApiMock
  let tab: EditorTabRef

  async function renderPanel(): Promise<DiagramStoreApi> {
    render(
      <>
        <DiagramEditor tab={tab} />
        <div data-testid="panel">
          <PropertiesPanel tab={tab} />
        </div>
      </>,
      { wrapper: queryWrapper() }
    )
    await waitFor(() => expect(getStore(tab.tabId)).toBeDefined())
    await waitFor(() => expect(screen.getAllByTestId(/^rf__node-/)).toHaveLength(2))
    return getStore(tab.tabId) as DiagramStoreApi
  }

  const select = (store: DiagramStoreApi, nodes: string[], edges: string[] = []): void =>
    act(() => {
      store.getState().onNodesChange(nodes.map((id) => ({ type: 'select', id, selected: true })))
      store.getState().onEdgesChange(edges.map((id) => ({ type: 'select', id, selected: true })))
    })

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    mock = createArchonApiMock({ platform: 'linux' })
    mock.api.fs.readDiagram.mockResolvedValue(ok(PHISHING))
    mock.api.index.listTags.mockResolvedValue(
      ok([
        { tag: 'triage', count: 1 },
        { tag: 't1566', count: 4 }
      ])
    )
    window.archon = mock.api
    const tabId = useEditorStore.getState().openFile('flows/phishing.ardiag', 'ardiag')
    tab = { tabId, filePath: 'flows/phishing.ardiag', kind: 'ardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.archon
  })

  it('shows the empty state without a selection', async () => {
    await renderPanel()
    expect(within(panel()).getByText(/Nothing selected\./)).toBeInTheDocument()
  })

  it('shows the node identity and fields', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    const p = within(panel())
    expect(p.getByText('Action node')).toBeInTheDocument()
    expect(p.getByText('N2')).toBeInTheDocument()
    expect(p.getByLabelText('Name')).toHaveValue('Contain Host')
    expect(p.getByLabelText('Subtitle')).toHaveValue('')
    expect(p.getByLabelText('Description')).toHaveValue('')
    expect(p.getByRole('switch', { name: 'Retry on fail' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('renames the node on the canvas in a single undo step', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    const name = within(panel()).getByLabelText('Name')
    const before = steps(store)

    fireEvent.focus(name)
    for (const value of ['C', 'Co', 'Con', 'Cont', 'Conta']) {
      fireEvent.change(name, { target: { value } })
    }
    fireEvent.blur(name)

    expect(node(store, 'N2')?.data.label).toBe('Conta')
    expect(within(screen.getByTestId('rf__node-N2')).getByText('Conta')).toBeInTheDocument()
    expect(steps(store)).toBe(before + 1)

    act(() => store.getState().undo())
    expect(node(store, 'N2')?.data.label).toBe('Contain Host')
  })

  it('changes the color with a swatch', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    fireEvent.click(within(panel()).getByRole('button', { name: 'Green' }))
    expect(node(store, 'N2')?.data.color).toBe('#059669')
    expect(within(panel()).getByRole('button', { name: 'Green' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('adds a tag with Enter and from the suggestions', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    const input = within(panel()).getByLabelText('Tags')

    fireEvent.change(input, { target: { value: 'enrichment' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(node(store, 'N2')?.data.tags).toEqual(['enrichment'])

    fireEvent.change(input, { target: { value: 't15' } })
    const suggestions = await within(panel()).findByRole('list', { name: 'Tag suggestions' })
    fireEvent.click(within(suggestions).getByRole('button', { name: 't1566' }))
    expect(node(store, 'N2')?.data.tags).toEqual(['enrichment', 't1566'])
  })

  it('toggles Retry on fail, only on nodes that support it', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    fireEvent.click(within(panel()).getByRole('switch', { name: 'Retry on fail' }))
    expect(node(store, 'N2')?.data.retryOnFail).toBe(true)

    act(() => store.getState().onNodesChange([{ type: 'select', id: 'N2', selected: false }]))
    select(store, ['N1'])
    expect(within(panel()).getByText('Trigger node')).toBeInTheDocument()
    expect(within(panel()).queryByRole('switch')).not.toBeInTheDocument()
  })

  it('deletes the node, empties the selection and shows the toast', async () => {
    const store = await renderPanel()
    select(store, ['N2'])
    fireEvent.click(within(panel()).getByRole('button', { name: 'Delete node' }))
    expect(store.getState().nodes.map((n) => n.id)).toEqual(['N1'])
    expect(within(panel()).getByText(/Nothing selected\./)).toBeInTheDocument()
    expect(useUiStore.getState().toast?.message).toBe('Node deleted — Ctrl+Z to undo')
  })

  it('edits the label of an edge', async () => {
    const store = await renderPanel()
    select(store, [], ['E1'])
    const label = within(panel()).getByLabelText('Label')
    expect(label).toHaveValue('yes')

    fireEvent.change(label, { target: { value: 'score ≥ 70' } })
    expect(store.getState().edges[0]?.label).toBe('score ≥ 70')
    fireEvent.change(label, { target: { value: '' } })
    expect(store.getState().edges[0]).not.toHaveProperty('label')
    expect(within(panel()).getByRole('button', { name: 'Delete edge' })).toBeInTheDocument()
  })

  it('colors several nodes at once and deletes them', async () => {
    const store = await renderPanel()
    select(store, ['N1', 'N2'])
    expect(within(panel()).getByText('2 nodes selected')).toBeInTheDocument()
    const before = steps(store)

    fireEvent.click(within(panel()).getByRole('button', { name: 'Red' }))
    expect(node(store, 'N1')?.data.color).toBe('#DC2626')
    expect(node(store, 'N2')?.data.color).toBe('#DC2626')
    expect(steps(store)).toBe(before + 1)

    fireEvent.click(within(panel()).getByRole('button', { name: 'Delete 2 nodes' }))
    expect(store.getState().nodes).toHaveLength(0)
  })
})
