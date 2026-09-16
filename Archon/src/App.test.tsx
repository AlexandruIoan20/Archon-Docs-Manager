import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SoarApi } from '@/core/types'
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
    const api: SoarApi = {
      app: {
        getInfo: vi.fn().mockResolvedValue({ name: 'x', version: '1.2.3', platform: 'linux' })
      }
    }
    window.soar = api

    renderApp()

    expect(await screen.findByTestId('app-info')).toHaveTextContent('v1.2.3 · linux')
  })

  it('reports a missing preload bridge', async () => {
    renderApp()

    expect(await screen.findByText(/IPC bridge unavailable/)).toBeInTheDocument()
  })
})
