import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { useEditorStore, useUiStore } from '@/store'
import { TitleBarDensityContext } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { PHISHING } from '@/test/sample-diagram'
import type { DiagramStoreApi } from '../../store/diagram.store'
import { getStore } from '../../store/store-registry'
import { DiagramEditor } from '../DiagramEditor'
import { DiagramStatusItems } from '../DiagramStatusItems'
import { PropertiesPanel } from '../PropertiesPanel'
import { DiagramToolbar } from '../toolbar/DiagramToolbar'

const renderMermaid = vi.hoisted(() =>
  vi.fn((source: string) => Promise.resolve({ svg: `<svg data-testid="svg">${source}</svg>` }))
)
vi.mock('../../mermaid/mermaid-loader', () => ({ renderMermaid }))

const SOURCE = 'sequenceDiagram\n  A ->> B: alert\n'
const TEXT_DIAGRAM = diagramFileSchema.parse({
  version: '1.0.0',
  id: 'diag-text',
  title: 'Alert flow',
  type: 'sequence',
  engine: 'mermaid',
  created: '2026-09-24T10:00:00.000Z',
  lastModified: '2026-09-24T10:00:00.000Z',
  mermaidSource: SOURCE
})

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }

describe('MermaidEditor', () => {
  let mock: ArchonApiMock
  let tab: EditorTabRef

  function renderEditor(): void {
    render(
      <TitleBarDensityContext.Provider value="full">
        <div data-testid="toolbar">
          <DiagramToolbar tab={tab} />
        </div>
        <DiagramEditor tab={tab} />
        <DiagramStatusItems tab={tab} />
        <div data-testid="inspector">
          <PropertiesPanel tab={tab} />
        </div>
      </TitleBarDensityContext.Provider>,
      { wrapper: queryWrapper() }
    )
  }

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    renderMermaid.mockClear()
    mock = createArchonApiMock({ platform: 'linux' })
    mock.api.fs.readDiagram.mockResolvedValue(ok(TEXT_DIAGRAM))
    window.archon = mock.api
    const tabId = useEditorStore.getState().openFile('flows/alert.ardiag', 'ardiag')
    tab = { tabId, filePath: 'flows/alert.ardiag', kind: 'ardiag' }
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.archon
  })

  it('shows the source and its preview instead of the canvas', async () => {
    renderEditor()
    const source = await screen.findByRole('textbox', { name: 'Mermaid source' })
    expect(source).toHaveValue(SOURCE)
    expect(await screen.findByTestId('svg')).toHaveTextContent('A ->> B: alert')
    expect(screen.queryByTestId('diagram-canvas')).not.toBeInTheDocument()
    expect(screen.getByTestId('toolbar')).toBeEmptyDOMElement()
    expect(screen.getByText('Mermaid · 2 lines')).toBeInTheDocument()
    expect(within(screen.getByTestId('inspector')).getByText(/Mermaid text/)).toBeInTheDocument()
  })

  it('saves the edited source', async () => {
    renderEditor()
    const source = await screen.findByRole('textbox', { name: 'Mermaid source' })
    fireEvent.change(source, { target: { value: `${SOURCE}  B -->> A: ack\n` } })

    const store = getStore(tab.tabId) as DiagramStoreApi
    expect(store.getState().meta.mermaidSource).toContain('B -->> A: ack')
    expect(screen.getByText('Mermaid · 3 lines')).toBeInTheDocument()
    expect(useEditorStore.getState().tabs[0]?.dirty).toBe(true)
    await waitFor(() => expect(mock.api.fs.writeDiagram).toHaveBeenCalled(), { timeout: 3000 })
    const saved = mock.api.fs.writeDiagram.mock.calls[0]?.[1]
    expect(saved).toMatchObject({ engine: 'mermaid', mermaidSource: `${SOURCE}  B -->> A: ack\n` })
  })

  it('indents with Tab instead of leaving the field', async () => {
    renderEditor()
    const source = (await screen.findByRole('textbox', {
      name: 'Mermaid source'
    })) as HTMLTextAreaElement
    source.setSelectionRange(0, 0)
    fireEvent.keyDown(source, { key: 'Tab' })
    expect(source.value.startsWith(`  sequenceDiagram`)).toBe(true)
  })

  it('never loads Mermaid for a canvas diagram', async () => {
    mock.api.fs.readDiagram.mockResolvedValue(ok(PHISHING))
    renderEditor()
    await screen.findByTestId('diagram-canvas')
    expect(renderMermaid).not.toHaveBeenCalled()
  })
})
