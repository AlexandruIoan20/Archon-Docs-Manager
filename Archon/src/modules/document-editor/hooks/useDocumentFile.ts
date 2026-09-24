import { useEffect } from 'react'
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import type { SoarDocument } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'

export const documentQueryKey = (relPath: string): readonly unknown[] => ['document', relPath]

/**
 * The document as saved on disk. It is read again when files change outside
 * the app (`workspace:tree-changed`); the editor decides what to do with it.
 */
export function useDocumentFile(relPath: string): UseQueryResult<SoarDocument> {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!ipcClient.isAvailable()) return
    return ipcClient.on('workspace:tree-changed', () => {
      void queryClient.invalidateQueries({ queryKey: documentQueryKey(relPath) })
    })
  }, [queryClient, relPath])

  return useQuery({
    queryKey: documentQueryKey(relPath),
    queryFn: () => ipcClient.fs.readDocument(relPath),
    staleTime: Infinity,
    retry: false
  })
}
