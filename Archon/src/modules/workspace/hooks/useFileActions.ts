import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { EntryRef } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { baseName, parentPath } from '@/core/utils/rel-path'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { treeQueryKey } from './useWorkspace'

export interface FileActions {
  newDocument: () => Promise<void>
  newFolder: () => Promise<void>
  /** Rejects with the `IpcError`, so an inline editor can show it. */
  rename: (relPath: string, newName: string) => Promise<EntryRef>
  move: (relPath: string, targetFolderRel: string) => Promise<EntryRef>
  remove: (relPath: string) => Promise<void>
}

/** `Playbooks/` for a file in Playbooks, `<root folder>/` at the top level. */
function folderLabel(relPath: string): string {
  const parent = parentPath(relPath)
  return `${parent || (useWorkspaceStore.getState().current?.rootName ?? '')}/`
}

/**
 * File operations as the tree uses them: each one refreshes the tree, keeps
 * expansion, target folder and the open file in step, and confirms with a toast.
 */
export function useFileActions(): FileActions {
  const queryClient = useQueryClient()

  const refreshTree = useCallback(async () => {
    const id = useWorkspaceStore.getState().current?.id
    if (id) await queryClient.invalidateQueries({ queryKey: treeQueryKey(id) })
  }, [queryClient])

  /** Runs a create in the target folder, which is expanded so the result shows. */
  const createInTarget = useCallback(
    async (create: (folder: string) => Promise<EntryRef>): Promise<EntryRef | null> => {
      const { targetFolder, setExpanded } = useWorkspaceStore.getState()
      const { notify } = useUiStore.getState()
      try {
        const created = await create(targetFolder)
        if (targetFolder) setExpanded(targetFolder, true)
        await refreshTree()
        return created
      } catch (error) {
        notify((error as Error).message, 'error')
        return null
      }
    },
    [refreshTree]
  )

  const newDocument = useCallback(async () => {
    const created = await createInTarget((folder) => ipcClient.fs.createDocument(folder))
    if (!created) return
    useEditorStore.getState().openFile(created.relPath, 'ardoc')
    useUiStore.getState().notify(`Document created in ${folderLabel(created.relPath)}`)
  }, [createInTarget])

  const newFolder = useCallback(async () => {
    const created = await createInTarget((folder) => ipcClient.fs.createFolder(folder))
    if (!created) return
    const workspace = useWorkspaceStore.getState()
    // The new folder becomes where the next files go, and its name is ready to type.
    workspace.setExpanded(created.relPath, true)
    workspace.setTargetFolder(created.relPath)
    workspace.setRenaming(created.relPath)
    useUiStore.getState().notify('Folder created')
  }, [createInTarget])

  const relocate = useCallback(
    async (relPath: string, run: () => Promise<EntryRef>): Promise<EntryRef> => {
      const moved = await run()
      useWorkspaceStore.getState().remapPaths(relPath, moved.relPath)
      useEditorStore.getState().renameTabPath(relPath, moved.relPath)
      await refreshTree()
      return moved
    },
    [refreshTree]
  )

  const rename = useCallback(
    (relPath: string, newName: string) =>
      relocate(relPath, () => ipcClient.fs.rename(relPath, newName)),
    [relocate]
  )

  const move = useCallback(
    (relPath: string, target: string) =>
      relocate(relPath, () => ipcClient.fs.move(relPath, target)),
    [relocate]
  )

  const remove = useCallback(
    async (relPath: string) => {
      const { notify } = useUiStore.getState()
      try {
        await ipcClient.fs.delete(relPath)
      } catch (error) {
        notify((error as Error).message, 'error')
        return
      }
      useWorkspaceStore.getState().forgetPaths(relPath, parentPath(relPath))
      useEditorStore.getState().closeByPath(relPath)
      await refreshTree()
      notify(`${baseName(relPath)} moved to trash`)
    },
    [refreshTree]
  )

  return { newDocument, newFolder, rename, move, remove }
}
