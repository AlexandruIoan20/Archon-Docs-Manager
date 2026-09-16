import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '@/core/ipc/ipc-client'
import { APP_NAME, QUERY_KEYS } from '@/core/constants/app.constants'

// Temporary shell: replaced by the real layout (TitleBar, Sidebar, EditorPane)
// in the next Phase 1 steps. It verifies the renderer → preload → main chain.
function App(): React.JSX.Element {
  const { data, error, isPending } = useQuery({
    queryKey: QUERY_KEYS.appInfo,
    queryFn: ipcClient.app.getInfo
  })

  return (
    <main className="flex h-full flex-col items-center justify-center gap-2 bg-neutral-950 text-neutral-200">
      <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
      {isPending && <p className="text-sm text-neutral-500">Connecting to main process…</p>}
      {error && <p className="text-sm text-red-400">IPC error: {error.message}</p>}
      {data && (
        <p className="text-sm text-neutral-500" data-testid="app-info">
          v{data.version} · {data.platform}
        </p>
      )}
    </main>
  )
}

export default App
