import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AppSettings, ResolvedTheme } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { useUiStore } from '@/store'
import { settingsQuery } from '@/shared/hooks/useSettings'
import { systemThemeQuery } from '@/shared/hooks/useTheme'
import { applyTheme, resolveTheme } from '@/shared/utils/apply-theme'
import App from './App'

// IPC calls are local and cheap to repeat, but window-focus refetching would
// cause needless disk reads in a desktop app.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 }
  }
})

async function loadSettings(): Promise<AppSettings> {
  try {
    return await queryClient.fetchQuery(settingsQuery)
  } catch (error) {
    console.error('[bootstrap] settings unavailable, using defaults', error)
    return DEFAULT_SETTINGS
  }
}

async function loadSystemTheme(): Promise<ResolvedTheme | undefined> {
  try {
    return await queryClient.fetchQuery(systemThemeQuery)
  } catch {
    return undefined
  }
}

/** Theme and panel layout are applied before React renders, so nothing flickers. */
async function bootstrap(): Promise<void> {
  const settings = await loadSettings()
  const { theme, accent } = settings.appearance
  const system = theme === 'system' ? await loadSystemTheme() : undefined
  applyTheme(resolveTheme(theme, system), accent)
  useUiStore.getState().hydratePanels(settings.layout)

  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Root element #root not found in index.html')

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
