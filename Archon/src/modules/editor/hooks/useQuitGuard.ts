import { useEffect } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { requestQuit } from './useEditorTabs'

/**
 * Answers main's `app:before-quit`, so closing the window never drops unsaved
 * changes. Main only waits for a page that announced this guard: a broken page
 * must not keep the window open.
 */
export function useQuitGuard(): void {
  useEffect(() => {
    if (!ipcClient.isAvailable()) return
    const unsubscribe = ipcClient.on('app:before-quit', () => void requestQuit())
    void ipcClient.app.enableCloseGuard().catch(console.error)
    return unsubscribe
  }, [])
}
