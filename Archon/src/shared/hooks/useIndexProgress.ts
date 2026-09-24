import { useEffect } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useStatusStore } from '@/store'

export const INDEXING_STATUS = 'Indexing…'

function showIndexing(indexing: boolean): void {
  const { statusText, setStatus, resetStatus } = useStatusStore.getState()
  if (indexing) setStatus(INDEXING_STATUS)
  // Only clear our own text: another status (e.g. „Connecting…”) may have replaced it.
  else if (statusText === INDEXING_STATUS) resetStatus()
}

/** Shows „Indexing…” in the status bar while main syncs the workspace index. Call once, in `App.tsx`. */
export function useIndexProgress(): void {
  useEffect(() => {
    if (!ipcClient.isAvailable()) return
    let heard = false
    const unsubscribe = ipcClient.on('index:progress', (progress) => {
      heard = true
      showIndexing(progress.state === 'indexing')
    })
    // A sync that started before the window loaded sent events nobody heard.
    ipcClient.index
      .getStatus()
      .then((status) => {
        if (!heard) showIndexing(status.indexing)
      })
      .catch(() => undefined)
    return unsubscribe
  }, [])
}
