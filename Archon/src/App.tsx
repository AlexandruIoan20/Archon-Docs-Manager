import { useQuery } from '@tanstack/react-query'
import { ipcClient } from '@/core/ipc/ipc-client'
import { APP_NAME, QUERY_KEYS } from '@/core/constants/app.constants'
import { PrimitivesPreview } from '@/dev/PrimitivesPreview'

// Temporary shell: replaced by the real layout (TitleBar, Sidebar, EditorPane)
// in plan 04. It verifies the renderer → preload → main chain and shows the
// shared primitives for visual review.
function App(): React.JSX.Element {
  const { data, error, isPending } = useQuery({
    queryKey: QUERY_KEYS.appInfo,
    queryFn: ipcClient.app.getInfo
  })

  return (
    <main className="flex h-full flex-col items-center gap-2 overflow-auto bg-bg pt-6 text-fg">
      <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
      {isPending && <p className="text-sm text-fg-muted">Connecting to main process...</p>}
      {error && <p className="text-sm text-red-400">IPC error: {error.message}</p>}
      {data && (
        <p className="text-sm text-fg-muted" data-testid="app-info">
          v{data.version} · {data.platform}
        </p>
      )}
      <PrimitivesPreview />
    </main>
  )
}

export default App
