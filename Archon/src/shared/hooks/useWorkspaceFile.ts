import { useEffect } from 'react'
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ipcClient } from '@/core/ipc/ipc-client'

/**
 * A workspace file as saved on disk, read through `read`. It is read again when
 * files change outside the app (`workspace:tree-changed`); the editor decides
 * what to do with a newer version (`useExternalChanges`).
 */
export function useWorkspaceFile<T>(
  queryKey: readonly unknown[],
  read: () => Promise<T>
): UseQueryResult<T> {
  const queryClient = useQueryClient()
  const keyHash = JSON.stringify(queryKey)

  useEffect(() => {
    if (!ipcClient.isAvailable()) return
    return ipcClient.on('workspace:tree-changed', () => {
      void queryClient.invalidateQueries({ queryKey: JSON.parse(keyHash) as unknown[] })
    })
  }, [queryClient, keyHash])

  return useQuery({ queryKey, queryFn: read, staleTime: Infinity, retry: false })
}
