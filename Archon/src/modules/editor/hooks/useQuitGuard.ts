import { useEffect } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { requestQuit } from './useEditorTabs'

/** Answers main's `app:before-quit`, so closing the window never drops unsaved changes. */
export function useQuitGuard(): void {
  useEffect(() => {
    if (!ipcClient.isAvailable()) return
    return ipcClient.on('app:before-quit', () => void requestQuit())
  }, [])
}
