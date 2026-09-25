import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { ok, SAMPLE_WORKSPACE } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { SAMPLE_TREE } from '@/test/sample-tree'
import type { DiagramStoreApi } from '../../../store/diagram.store'
import { getStore } from '../../../store/store-registry'
import { MERMAID_TEMPLATES } from '../../../mermaid/templates'
import { buildStarterGraph } from '../../../utils/build-starter-graph'
import { DiagramEditor } from '../../DiagramEditor'
import { NewDiagramDialog } from '../NewDiagramDialog'

const initial = {
  editor: useEditorStore.getState(),
  ui: useUiStore.getState(),
  workspace: useWorkspaceStore.getState()
}
const dialog = (): HTMLElement => screen.getByRole('dialog', { name: 'New diagram' })
const grid = (): HTMLElement => within(dialog()).getByRole('listbox', { name: 'Diagram types' })
const card = (name: string): HTMLElement =>
  within(grid()).getByRole('option', { name: new RegExp(`^${name}`) })
const shownTypes = (): string[] =>
  within(grid())
    .getAllByRole('option')
    .map((option) => option.dataset.type ?? '')

describe('NewDiagramDialog', () => {
  let mock: ArchonApiMock

  beforeEach(async () => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    useWorkspaceStore.setState(initial.workspace, true)
    mock = createArchonApiMock({ tree: SAMPLE_TREE, platform: 'linux' })
    window.archon = mock.api
    useWorkspaceStore.getState().setCurrent(SAMPLE_WORKSPACE)
    useWorkspaceStore.getState().setTargetFolder('Playbooks')
    render(<ModalHost modals={{ 'new-diagram': NewDiagramDialog }} />, {
      wrapper: queryWrapper()
    })
    act(() => useUiStore.getState().openModal('new-diagram'))
    await within(dialog()).findByRole('radio', { name: 'Playbooks/Phishing/' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.archon
  })

  it('opens with the focus in the search, all 14 types and Class selected', () => {
    expect(within(dialog()).getByRole('searchbox')).toHaveFocus()
    expect(shownTypes()).toHaveLength(14)
    expect(card('Class')).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog()).getByText('Class diagram')).toBeInTheDocument()
  })

  it('filters by the search: „seq” leaves only Sequence, selected', () => {
    fireEvent.change(within(dialog()).getByRole('searchbox'), { target: { value: 'seq' } })
    expect(shownTypes()).toEqual(['sequence'])
    expect(card('Sequence')).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the empty state when nothing matches', () => {
    fireEvent.change(within(dialog()).getByRole('searchbox'), { target: { value: 'venn' } })
    expect(within(dialog()).getByText('No diagram type matches “venn”')).toBeInTheDocument()
    expect(within(dialog()).getByRole('button', { name: /Create diagram/ })).toBeDisabled()
  })

  it('hides the structural group in the Behavioral category', () => {
    const column = within(dialog()).getByRole('navigation', { name: 'Category' })
    fireEvent.click(within(column).getByRole('button', { name: /Behavioral/ }))
    expect(within(grid()).queryByRole('group', { name: 'Structural' })).not.toBeInTheDocument()
    expect(within(grid()).getByRole('group', { name: 'Behavioral' })).toBeInTheDocument()
    expect(shownTypes()).toHaveLength(7)
  })

  it('moves the selection with the arrow keys', () => {
    fireEvent.keyDown(card('Class'), { key: 'ArrowRight' })
    expect(card('Object')).toHaveAttribute('aria-selected', 'true')
    expect(card('Object')).toHaveFocus()
    fireEvent.keyDown(card('Object'), { key: 'End' })
    expect(card('Interaction overview')).toHaveAttribute('aria-selected', 'true')
  })

  it('creates on double-click, with the type, its starters and the target folder', async () => {
    fireEvent.doubleClick(card('State machine'))
    await waitFor(() => expect(mock.api.fs.createDiagram).toHaveBeenCalledOnce())
    expect(mock.api.fs.createDiagram).toHaveBeenCalledWith('Playbooks', {
      type: 'state',
      ...buildStarterGraph('state')
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await waitFor(() => expect(useEditorStore.getState().tabs).toHaveLength(1))
    const tab = useEditorStore.getState().tabs[0]
    expect(tab?.relPath).toBe('Playbooks/state-1.ardiag')
    expect(useEditorStore.getState().pendingSelection[tab?.id ?? '']).toEqual(['N1'])
    expect(useWorkspaceStore.getState().expanded.Playbooks).toBe(true)
    expect(useUiStore.getState().toast?.message).toBe('State machine diagram created in Playbooks/')
  })

  it('creates with Enter, in the folder picked under „saves to”', async () => {
    fireEvent.click(within(dialog()).getByRole('radio', { name: 'secops-core/' }))
    expect(useWorkspaceStore.getState().targetFolder).toBe('')
    fireEvent.click(card('Sequence'))
    fireEvent.keyDown(card('Sequence'), { key: 'Enter' })
    await waitFor(() => expect(mock.api.fs.createDiagram).toHaveBeenCalledOnce())
    expect(mock.api.fs.createDiagram.mock.calls[0]?.[0]).toBe('')
    expect(mock.api.fs.createDiagram.mock.calls[0]?.[1]).toMatchObject({ type: 'sequence' })
  })

  it('offers „Text” only for the types Mermaid draws', () => {
    const text = (): HTMLElement => within(dialog()).getByRole('radio', { name: 'Text' })
    fireEvent.click(card('Deployment'))
    expect(text()).toBeDisabled()
    fireEvent.click(card('Sequence'))
    expect(text()).toBeEnabled()
    fireEvent.click(text())
    expect(text()).toHaveAttribute('aria-checked', 'true')
    // Back to a canvas-only type: the dialog creates a canvas diagram.
    fireEvent.click(card('Timing'))
    expect(within(dialog()).getByRole('radio', { name: 'Canvas' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('creates a Mermaid text diagram from the template', async () => {
    fireEvent.click(card('Sequence'))
    fireEvent.click(within(dialog()).getByRole('radio', { name: 'Text' }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /Create diagram/ }))
    await waitFor(() => expect(mock.api.fs.createDiagram).toHaveBeenCalledOnce())
    expect(mock.api.fs.createDiagram).toHaveBeenCalledWith('Playbooks', {
      type: 'sequence',
      engine: 'mermaid',
      mermaidSource: MERMAID_TEMPLATES.sequence
    })
    await waitFor(() => expect(useEditorStore.getState().tabs).toHaveLength(1))
    expect(useEditorStore.getState().pendingSelection).toEqual({})
  })

  it('closes with Escape without creating', () => {
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mock.api.fs.createDiagram).not.toHaveBeenCalled()
  })

  it('closes with a mousedown on the backdrop', () => {
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not create when Enter is on Cancel', () => {
    fireEvent.keyDown(within(dialog()).getByRole('button', { name: 'Cancel' }), { key: 'Enter' })
    expect(mock.api.fs.createDiagram).not.toHaveBeenCalled()
  })
})

describe('a new diagram, once open', () => {
  afterEach(() => {
    delete window.archon
  })

  it('has N1 selected and an empty history', async () => {
    useEditorStore.setState(initial.editor, true)
    const mock = createArchonApiMock({ platform: 'linux' })
    mock.api.fs.readDiagram.mockResolvedValue(
      ok(
        diagramFileSchema.parse({
          version: '1.0.0',
          id: 'diag-new',
          title: '',
          type: 'state',
          created: '2026-09-24T10:00:00.000Z',
          lastModified: '2026-09-24T10:00:00.000Z',
          data: buildStarterGraph('state')
        })
      )
    )
    window.archon = mock.api
    const tabId = useEditorStore.getState().openFile('Playbooks/state-1.ardiag', 'ardiag')
    useEditorStore.getState().setPendingSelection(tabId, ['N1'])

    render(
      <DiagramEditor tab={{ tabId, filePath: 'Playbooks/state-1.ardiag', kind: 'ardiag' }} />,
      { wrapper: queryWrapper() }
    )
    await waitFor(() => expect(getStore(tabId)).toBeDefined())
    const state = (getStore(tabId) as DiagramStoreApi).getState()
    expect(state.nodes.map((n) => [n.data.label, Boolean(n.selected)])).toEqual([
      ['New', true],
      ['Contained', false]
    ])
    expect(state.selection).toEqual({ nodes: ['N1'], edges: [] })
    expect(state.history.past).toHaveLength(0)
    expect(useEditorStore.getState().pendingSelection).toEqual({})
  })
})
