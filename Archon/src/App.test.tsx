import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useUiStore, useWorkspaceStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import type { SoarApiMockOptions } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import App from './App'

const initialUi = useUiStore.getState()
const initialWorkspace = useWorkspaceStore.getState()

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
})
