import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// IPC calls are local and cheap to repeat, but window-focus refetching would
// cause needless disk reads in a desktop app.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 }
  }
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
