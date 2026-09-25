import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchResult } from '@/core/types'
import { SEARCH_MATCH_END as E, SEARCH_MATCH_START as S } from '@/core/constants/search.constants'
import { openSearchPalette, useEditorStore, useUiStore } from '@/store'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { GlobalSearch } from '../GlobalSearch'

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }

const RESULTS: SearchResult[] = [
  {
    fileId: 'diag-1',
    relPath: 'Playbooks/Phishing/phishing-triage.ardiag',
    kind: 'ardiag',
    fileTitle: 'Phishing triage',
    nodeId: 'N4',
    nodeLabel: 'Contain Host',
    snippet: `${S}Isolate${E} the endpoint <img src=x onerror="alert(1)">`,
    score: -3
  },
  {
    fileId: 'doc-1',
    relPath: 'Runbooks/on-call.ardoc',
    kind: 'ardoc',
    fileTitle: 'On call',
    nodeId: null,
    nodeLabel: null,
    snippet: `Page, then ${S}isolate${E} the host`,
    score: -1
  }
]

describe('GlobalSearch', () => {
  let mock: SoarApiMock

  const palette = (): HTMLElement => screen.getByRole('dialog', { name: 'Search the workspace' })
  const type = (text: string): void => {
    fireEvent.change(within(palette()).getByRole('combobox'), { target: { value: text } })
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    mock = createSoarApiMock({ platform: 'linux' })
    mock.api.search.query.mockResolvedValue(ok(RESULTS))
    window.soar = mock.api
    render(<ModalHost modals={{ 'command-palette': GlobalSearch }} />, { wrapper: queryWrapper() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.soar
  })

  it('searches after 2 characters and groups the results', async () => {
    act(() => openSearchPalette())
    expect(within(palette()).getByRole('combobox')).toHaveFocus()
    type('i')
    expect(within(palette()).getByText('Type at least 2 characters.')).toBeInTheDocument()

    type('isolate')
    const nodes = await within(palette()).findByRole('group', { name: 'Nodes' })
    expect(mock.api.search.query).toHaveBeenCalledWith('isolate', undefined)
    expect(within(nodes).getByText('Contain Host')).toBeInTheDocument()
    expect(within(palette()).getByRole('group', { name: 'Content' })).toHaveTextContent('On call')
    // The snippet's markup stays text.
    expect(palette().querySelector('img')).toBeNull()
    expect(within(nodes).getByText('Isolate').tagName).toBe('MARK')
  })

  it('opens the node with Enter: the diagram, the node selected and centred', async () => {
    act(() => openSearchPalette())
    type('isolate')
    await within(palette()).findByRole('group', { name: 'Nodes' })
    fireEvent.keyDown(within(palette()).getByRole('combobox'), { key: 'Enter' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const { tabs, pendingSelection, pendingFocus } = useEditorStore.getState()
    expect(tabs.map((t) => t.relPath)).toEqual(['Playbooks/Phishing/phishing-triage.ardiag'])
    const tabId = tabs[0]?.id ?? ''
    expect(pendingSelection[tabId]).toEqual(['N4'])
    expect(pendingFocus[tabId]).toBe('N4')
  })

  it('moves with the arrow keys and opens a document', async () => {
    act(() => openSearchPalette())
    type('isolate')
    await within(palette()).findByRole('group', { name: 'Content' })
    const input = within(palette()).getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(within(palette()).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useEditorStore.getState().tabs.map((t) => t.relPath)).toEqual(['Runbooks/on-call.ardoc'])
    expect(useEditorStore.getState().pendingFocus).toEqual({})
  })

  it('filters by kind and hands the pick over, when asked to', async () => {
    const onPick = vi.fn()
    act(() => openSearchPalette({ kind: 'ardoc', onPick }))
    type('isolate')
    await within(palette()).findByRole('group', { name: 'Content' })
    expect(within(palette()).queryByRole('group', { name: 'Nodes' })).not.toBeInTheDocument()
    fireEvent.click(within(palette()).getByRole('option'))
    expect(onPick).toHaveBeenCalledWith(RESULTS[1])
    expect(useEditorStore.getState().tabs).toHaveLength(0)
  })

  it('says when nothing matches', async () => {
    mock.api.search.query.mockResolvedValue(ok([]))
    act(() => openSearchPalette())
    type('zzz')
    expect(await within(palette()).findByText('No results for “zzz”')).toBeInTheDocument()
  })
})
