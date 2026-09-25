import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SearchResult } from '@/core/types'
import { useSearchPaletteStore, useUiStore } from '@/store'
import { useDocumentEditorStore } from '../../store/document-editor.store'
import { DocumentInspector } from '../DocumentInspector'

const TAB = { tabId: 'tab-doc', filePath: 'Runbooks/ir.soardoc', kind: 'soardoc' as const }

const diagram = (fileId: string): SearchResult => ({
  fileId,
  relPath: `Playbooks/${fileId}.soardiag`,
  kind: 'soardiag',
  fileTitle: fileId,
  nodeId: null,
  nodeLabel: null,
  snippet: '',
  score: -1
})

describe('DocumentInspector', () => {
  afterEach(() => {
    act(() => useDocumentEditorStore.getState().remove(TAB.tabId))
    useUiStore.setState({ activeModal: null })
  })

  it('links a diagram picked in the palette, filtered on diagrams, once', () => {
    const changed = vi.fn()
    useDocumentEditorStore.getState().open(TAB.tabId, {
      editor: null,
      title: 'IR',
      tags: [],
      linkedDiagrams: [],
      words: 0,
      changed
    })
    render(<DocumentInspector tab={TAB} />)
    fireEvent.click(screen.getByRole('button', { name: 'Link diagram' }))

    expect(useUiStore.getState().activeModal).toBe('command-palette')
    const { request } = useSearchPaletteStore.getState()
    expect(request.kind).toBe('soardiag')
    act(() => request.onPick?.(diagram('diag-7')))
    act(() => request.onPick?.(diagram('diag-7')))

    expect(useDocumentEditorStore.getState().sessions[TAB.tabId]?.linkedDiagrams).toEqual([
      'diag-7'
    ])
    expect(changed).toHaveBeenCalledOnce()
    expect(within(screen.getByRole('list')).getByText('diag-7')).toBeInTheDocument()
  })
})
