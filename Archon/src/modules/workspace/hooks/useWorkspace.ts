import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { FolderEntry, WorkspaceInfo } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { isIpcError } from '@/core/ipc/ipc-error'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { useUiStore, useWorkspaceStore } from '@/store'
import { settingsQuery } from '@/shared/hooks/useSettings'
import { useExpandedPersistence } from './useExpandedPersistence'

export const treeQueryKey = (workspaceId: string): readonly unknown[] => [
  ...QUERY_KEYS.workspaceTree,
  workspaceId
]

/**
 * Mirrors the open workspace into `workspace.store` and refreshes the tree when
 * files change on disk. Call it once, in `App.tsx`.
 */
export function useWorkspaceSync(): { current: WorkspaceInfo | null; ready: boolean } {
  const queryClient = useQueryClient()
  const setCurrent = useWorkspaceStore((s) => s.setCurrent)
  const { data, isFetched } = useQuery({
    queryKey: QUERY_KEYS.workspaceCurrent,
    queryFn: ipcClient.workspace.getCurrent,
    staleTime: Infinity,
    retry: false
  })
  const current = data ?? null

  useEffect(() => setCurrent(current), [current, setCurrent])
  useExpandedPersistence()

  useEffect(() => {
    if (!current || !ipcClient.isAvailable()) return
    return ipcClient.on('workspace:tree-changed', () => {
      void queryClient.invalidateQueries({ queryKey: treeQueryKey(current.id) })
    })
  }, [current, queryClient])

  return { current, ready: isFetched }
}

/** The tree of the open workspace. */
export function useWorkspaceTree(): { tree: FolderEntry | undefined; isLoading: boolean } {
  const current = useWorkspaceStore((s) => s.current)
  const { data, isLoading } = useQuery({
    queryKey: treeQueryKey(current?.id ?? ''),
    queryFn: ipcClient.workspace.readTree,
    enabled: current !== null,
    staleTime: Infinity,
    retry: false
  })
  return { tree: data, isLoading }
}

function applyWorkspace(queryClient: QueryClient, workspace: WorkspaceInfo | null): void {
  queryClient.setQueryData(QUERY_KEYS.workspaceCurrent, workspace)
  // Main updated the recent list.
  void queryClient.invalidateQueries({ queryKey: settingsQuery.queryKey })
}

export interface WorkspaceActions {
  create: (name: string) => void
  openDialog: () => void
  openRecent: (rootPath: string) => void
  close: () => void
  pending: boolean
}

/** Create / open / close, with errors reported as toasts. */
export function useWorkspaceActions(): WorkspaceActions {
  const queryClient = useQueryClient()
  const notify = useUiStore((s) => s.notify)

  const onError = (error: Error): void => {
    const message = isIpcError(error, 'NOT_FOUND')
      ? `${error.message}. It was removed from the recent list.`
      : error.message
    notify(message, 'error')
    void queryClient.invalidateQueries({ queryKey: settingsQuery.queryKey })
  }
  const onOpened = (workspace: WorkspaceInfo | null): void => {
    if (workspace) applyWorkspace(queryClient, workspace)
  }

  const create = useMutation({
    mutationFn: ipcClient.workspace.create,
    onSuccess: onOpened,
    onError
  })
  const openDialog = useMutation({
    mutationFn: ipcClient.workspace.openDialog,
    onSuccess: onOpened,
    onError
  })
  const openRecent = useMutation({
    mutationFn: ipcClient.workspace.openRecent,
    onSuccess: onOpened,
    onError
  })
  const close = useMutation({
    mutationFn: ipcClient.workspace.close,
    onSuccess: () => applyWorkspace(queryClient, null),
    onError
  })

  return {
    create: create.mutate,
    openDialog: () => openDialog.mutate(),
    openRecent: openRecent.mutate,
    close: () => close.mutate(),
    pending: create.isPending || openDialog.isPending || openRecent.isPending || close.isPending
  }
}
