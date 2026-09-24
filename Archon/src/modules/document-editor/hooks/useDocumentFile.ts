import type { UseQueryResult } from '@tanstack/react-query'
import type { SoarDocument } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useWorkspaceFile } from '@/shared/hooks/useWorkspaceFile'

export const documentQueryKey = (relPath: string): readonly unknown[] => ['document', relPath]

/** The document as saved on disk, read again when files change outside the app. */
export function useDocumentFile(relPath: string): UseQueryResult<SoarDocument> {
  return useWorkspaceFile(documentQueryKey(relPath), () => ipcClient.fs.readDocument(relPath))
}
