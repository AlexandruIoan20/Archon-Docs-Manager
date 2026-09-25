import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import type { SoarApiMockOptions } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { SAMPLE_TREE } from '@/test/sample-tree'
import { ok, SAMPLE_WORKSPACE } from '@/test/workspace-api-mock'
import App from './App'

const initialUi = useUiStore.getState()
const initialWorkspace = useWorkspaceStore.getState()
const initialEditor = useEditorStore.getState()

function install(options: SoarApiMockOptions = {}): SoarApiMock {
  const mock = createSoarApiMock({ platform: 'linux', ...options })
  window.soar = mock.api
  return mock
}

function renderApp(): void {
  render(<App />, { wrapper: queryWrapper() })
}

/** Renders the app with a workspace open and waits for the shell body. */
async function renderShell(options: SoarApiMockOptions = {}): Promise<SoarApiMock> {
  const mock = install(options)
  renderApp()
  await screen.findByTestId('tab-bar')
  return mock
}

function setWindowWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

const panel = (name: 'Sidebar' | 'Inspector'): HTMLElement | null =>
  screen.queryByRole('complementary', { name })

const press = (init: KeyboardEventInit): void =>
  act(() => void fireEvent.keyDown(window, { code: 'KeyB', ctrlKey: true, ...init }))

describe('App', () => {
  beforeEach(() => {
    useUiStore.setState(initialUi, true)
    useWorkspaceStore.setState(initialWorkspace, true)
    useEditorStore.setState(initialEditor, true)
    setWindowWidth(1440)
    document.documentElement.dataset.theme = 'dark'
  })

  afterEach(() => {
    delete window.soar
  })

  it('renders the shell with title bar, panels and status bar', async () => {
    await renderShell()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(panel('Sidebar')).toHaveAttribute('data-mode', 'docked')
    expect(panel('Inspector')).toHaveAttribute('data-mode', 'docked')
    const statusBar = within(screen.getByRole('contentinfo'))
    expect(statusBar.getByText('Ready')).toBeInTheDocument()
    expect(statusBar.getByText('No file open')).toBeInTheDocument()
    expect(statusBar.getByText('DARK')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('shows the landing screen, with title and status bars, when no workspace is open', async () => {
    install({ workspace: null })
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Open a workspace' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(panel('Sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument()
  })

  it('enters the shell once a workspace is created', async () => {
    const mock = install({ workspace: null })
    renderApp()

    fireEvent.click(await screen.findByRole('button', { name: 'Create workspace' }))
    expect(await screen.findByTestId('tab-bar')).toBeInTheDocument()
    expect(mock.api.workspace.create).toHaveBeenCalledWith('')
  })

  it('falls back to the landing screen without the preload bridge', async () => {
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Open a workspace' })).toBeInTheDocument()
  })

  it('confirms an interface zoom change with a toast', async () => {
    await renderShell()
    await act(async () => void fireEvent.keyDown(window, { code: 'Equal', ctrlKey: true }))
    expect(await screen.findByRole('status')).toHaveTextContent('Zoom 110%')
  })

  it('toggles the panels with Ctrl+B and Ctrl+Alt+B', async () => {
    await renderShell()

    press({})
    expect(panel('Sidebar')).not.toBeInTheDocument()
    press({})
    expect(panel('Sidebar')).toBeInTheDocument()
    press({ key: '∫', altKey: true })
    expect(panel('Inspector')).not.toBeInTheDocument()
  })

  it('opens a panel that does not fit as a drawer', async () => {
    setWindowWidth(1093)
    await renderShell()
    expect(panel('Inspector')).not.toBeInTheDocument()

    press({ altKey: true })
    expect(panel('Inspector')).toHaveAttribute('data-mode', 'overlay')
    expect(useUiStore.getState().panels.inspector.visible).toBe(true)
  })

  it('switches and persists the theme from the title bar toggle', async () => {
    const mock = await renderShell()

    fireEvent.click(await screen.findByRole('button', { name: 'Switch to light theme' }))

    expect(await screen.findByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('light')
    await waitFor(() => expect(mock.storedSettings().appearance.theme).toBe('light'))
  })

  it('opens a file from the tree in a tab and shows its path in the status bar', async () => {
    const mock = await renderShell({ tree: SAMPLE_TREE })
    mock.api.fs.readDocument.mockResolvedValue(
      ok({
        version: '1.0.0',
        id: 'doc-1',
        title: 'Incident policy',
        created: '2026-09-01T10:00:00.000Z',
        lastModified: '2026-09-01T10:00:00.000Z',
        content: { type: 'doc', content: [] },
        tags: [],
        linkedDiagrams: []
      })
    )
    expect(screen.getByText('No file open', { selector: 'h1' })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('treeitem', { name: 'incident-policy' }))
    const openFiles = screen.getByRole('tablist', { name: 'Open files' })
    const tab = await within(openFiles).findByRole('tab', { name: /incident-policy/ })
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('textbox', { name: 'Document title' })).toHaveValue(
      'Incident policy'
    )
    // The document editor fills the title bar, the inspector and the status bar.
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Add tag' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toHaveTextContent('incident-policy.ardoc')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('0 words')

    fireEvent.click(within(tab).getByRole('button', { name: 'Close incident-policy' }))
    await waitFor(() => expect(within(openFiles).queryByRole('tab')).toBeNull())
    // The (now empty) tab list is saved for the workspace.
    await waitFor(() =>
      expect(mock.storedSettings().session.tabsByWorkspace?.[SAMPLE_WORKSPACE.id]).toEqual({
        tabs: [],
        active: null
      })
    )
  })

  it('opens the search with Ctrl+K and the shortcuts with Ctrl+/, from anywhere', async () => {
    await renderShell()
    act(() => void fireEvent.keyDown(window, { key: 'k', ctrlKey: true }))
    expect(await screen.findByRole('dialog', { name: 'Search the workspace' })).toBeInTheDocument()
    // From inside the palette's own field too.
    act(() => void fireEvent.keyDown(screen.getByRole('combobox'), { key: '/', ctrlKey: true }))
    const help = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })
    for (const group of ['General', 'File tree', 'Diagram canvas', 'Document editor']) {
      expect(within(help).getByRole('heading', { name: group })).toBeInTheDocument()
    }
    expect(within(help).getByText('Search the workspace')).toBeInTheDocument()
    expect(within(help).getAllByText('Ctrl+Shift+Z').length).toBeGreaterThan(0)
  })
})
