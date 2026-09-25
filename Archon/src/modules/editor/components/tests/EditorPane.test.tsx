import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditorContribution, EditorSlotProps } from '@/core/types'
import { EditorContributionsProvider } from '@/core/editor/EditorContributionsProvider'
import { useEditorStore } from '@/store'
import { EditorPane } from '../EditorPane'

const initialEditor = useEditorStore.getState()

const DocEditor = ({ tab }: EditorSlotProps): React.JSX.Element => (
  <div data-testid="doc-editor">{tab.filePath}</div>
)

let explode = true
function Crashing(): React.JSX.Element {
  if (explode) throw new Error('boom')
  return <div data-testid="recovered" />
}

function renderPane(contributions: EditorContribution[]): {
  onNewDiagram: () => void
  onNewDocument: () => void
} {
  const handlers = { onNewDiagram: vi.fn(), onNewDocument: vi.fn() }
  render(
    <EditorContributionsProvider contributions={contributions}>
      <EditorPane platform="linux" {...handlers} />
    </EditorContributionsProvider>
  )
  return handlers
}

describe('EditorPane', () => {
  beforeEach(() => {
    useEditorStore.setState(initialEditor, true)
  })

  it('shows the welcome screen without tabs', () => {
    const { onNewDiagram, onNewDocument } = renderPane([])
    expect(screen.getByText('No file open')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+W')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'New diagram' }))
    fireEvent.click(screen.getByRole('button', { name: 'New document' }))
    expect(onNewDiagram).toHaveBeenCalledOnce()
    expect(onNewDocument).toHaveBeenCalledOnce()
  })

  it('renders the editor registered for the active file kind', () => {
    useEditorStore.getState().openFile('Runbooks/a.ardoc', 'ardoc')
    renderPane([{ kind: 'ardoc', Editor: DocEditor }])
    expect(screen.getByTestId('doc-editor')).toHaveTextContent('Runbooks/a.ardoc')
  })

  it('explains when no editor handles the kind', () => {
    useEditorStore.getState().openFile('flow.ardiag', 'ardiag')
    renderPane([{ kind: 'ardoc', Editor: DocEditor }])
    expect(screen.getByRole('alert')).toHaveTextContent('No editor is available for flow.ardiag')
  })

  it('contains a crashing editor and lets it retry', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    explode = true
    useEditorStore.getState().openFile('flow.ardiag', 'ardiag')
    renderPane([{ kind: 'ardiag', Editor: Crashing }])

    expect(screen.getByRole('alert')).toHaveTextContent('flow could not be displayed')
    explode = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByTestId('recovered')).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
