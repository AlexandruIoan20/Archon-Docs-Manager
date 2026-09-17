import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '@/core/ipc/ipc-client'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { TitleBar } from '@/shared/components/layout/TitleBar'
import type { ThemeToggleValue } from '@/shared/components/layout/title-bar/ThemeToggleButton'
import { PrimitivesPreview } from '@/dev/PrimitivesPreview'

// Temporary shell: replaced by the real layout (Sidebar, EditorPane, StatusBar)
// in plan 04. It verifies the renderer → preload → main chain and shows the
// shared primitives for visual review under the real title bar.
function App(): React.JSX.Element {
  const { data, error, isPending } = useQuery({
    queryKey: QUERY_KEYS.appInfo,
    queryFn: ipcClient.app.getInfo
  })

  // Provisional: plan 05 replaces this with persisted settings and `useTheme`.
  const [theme, setTheme] = useState<ThemeToggleValue>('dark')
  const toggleTheme = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <TitleBar toolbar={null} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-auto pt-6">
        {isPending && <p className="text-sm text-fg-muted">Connecting to main process...</p>}
        {error && <p className="text-sm text-danger">IPC error: {error.message}</p>}
        {data && (
          <p className="text-sm text-fg-muted" data-testid="app-info">
            v{data.version} · {data.platform}
          </p>
        )}
        <PrimitivesPreview />
      </main>
    </div>
  )
}

export default App
