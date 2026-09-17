import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createSoarApiMock } from '@/test/soar-api-mock'
import App from './App'

function renderApp(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  )
}

describe('App', () => {
  afterEach(() => {
    delete window.soar
  })

  it('shows app info received through the IPC bridge', async () => {
    window.soar = createSoarApiMock({ version: '1.2.3', platform: 'linux' }).api

    renderApp()

    expect(await screen.findByTestId('app-info')).toHaveTextContent('v1.2.3 · linux')
  })

  it('renders the title bar with Linux window controls', async () => {
    window.soar = createSoarApiMock({ platform: 'linux' }).api

    renderApp()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('reports a missing preload bridge', async () => {
    renderApp()

    expect(await screen.findByText(/IPC bridge unavailable/)).toBeInTheDocument()
  })
})
