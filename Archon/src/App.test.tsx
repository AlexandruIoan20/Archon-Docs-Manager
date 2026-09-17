import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUiStore } from '@/store'
import { createSoarApiMock } from '@/test/soar-api-mock'
import App from './App'

const initialState = useUiStore.getState()

function renderApp(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  )
}

function setWindowWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

const panel = (name: 'Sidebar' | 'Inspector'): HTMLElement | null =>
  screen.queryByRole('complementary', { name })

describe('App', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
    setWindowWidth(1440)
  })

  afterEach(() => {
    delete window.soar
  })

  it('renders the shell with title bar, panels and status bar', async () => {
    window.soar = createSoarApiMock({ platform: 'linux' }).api
    renderApp()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('No file open')
    expect(panel('Sidebar')).toHaveAttribute('data-mode', 'docked')
    expect(panel('Inspector')).toHaveAttribute('data-mode', 'docked')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('still renders the shell without the preload bridge', () => {
    renderApp()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('toggles the panels with Ctrl+B and Ctrl+Alt+B', () => {
    renderApp()

    act(() => void fireEvent.keyDown(window, { code: 'KeyB', key: 'b', ctrlKey: true }))
    expect(panel('Sidebar')).not.toBeInTheDocument()
    act(() => void fireEvent.keyDown(window, { code: 'KeyB', key: 'b', ctrlKey: true }))
    expect(panel('Sidebar')).toBeInTheDocument()

    act(
      () => void fireEvent.keyDown(window, { code: 'KeyB', key: '∫', ctrlKey: true, altKey: true })
    )
    expect(panel('Inspector')).not.toBeInTheDocument()
  })

  it('opens a panel that does not fit as a drawer', () => {
    setWindowWidth(1093)
    renderApp()
    expect(panel('Inspector')).not.toBeInTheDocument()

    act(() => void fireEvent.keyDown(window, { code: 'KeyB', ctrlKey: true, altKey: true }))
    expect(panel('Inspector')).toHaveAttribute('data-mode', 'overlay')
    expect(useUiStore.getState().panels.inspector.visible).toBe(true)
  })
})
