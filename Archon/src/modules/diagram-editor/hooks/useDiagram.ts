import { useCallback, useEffect } from 'react'
import type { EditorTabRef, SoarDiagram } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useEditorStore } from '@/store'
import { useExternalChanges } from '@/shared/hooks/useExternalChanges'
import { useFileAutosave } from '@/shared/hooks/useFileAutosave'
import { useWorkspaceFile } from '@/shared/hooks/useWorkspaceFile'
import { createDiagramStore, type DiagramStoreApi } from '../store/diagram.store'
import { getStore, registerStore, useRegisteredStore } from '../store/store-registry'
import { fileToGraph, graphToFile, withSelectedNodes } from '../utils/graph-mapping'

export const diagramQueryKey = (relPath: string): readonly unknown[] => ['diagram', relPath]

export interface DiagramLoad {
  store: DiagramStoreApi | null
  error: Error | null
}

/**
 * One open diagram: loads the file, keeps the tab's store (created once, kept
 * across tab switches), autosaves edits and follows changes made on disk.
 */
export function useDiagram({ tabId, filePath }: EditorTabRef): DiagramLoad {
  const queryKey = diagramQueryKey(filePath)
  const { data, error } = useWorkspaceFile(queryKey, () => ipcClient.fs.readDiagram(filePath))
  const store = useRegisteredStore(tabId) ?? null

  // Created once per tab; it outlives tab switches and goes when the tab closes.
  useEffect(() => {
    if (data && !getStore(tabId)) {
      const graph = fileToGraph(data)
      const pending = useEditorStore.getState().takePendingSelection(tabId)
      registerStore(
        tabId,
        createDiagramStore(pending ? withSelectedNodes(graph, pending) : graph, data)
      )
    }
  }, [data, tabId])

  // A selection asked for later, e.g. a search result in a diagram already open.
  useEffect(() => {
    if (!store) return
    const apply = (): void => {
      const ids = useEditorStore.getState().takePendingSelection(tabId)
      if (ids) store.getState().selectNodes(ids)
    }
    apply()
    return useEditorStore.subscribe((state, prev) => {
      if (state.pendingSelection !== prev.pendingSelection && state.pendingSelection[tabId]) apply()
    })
  }, [store, tabId])

  const build = useCallback(
    (): SoarDiagram | null => (store ? graphToFile(store.getState()) : null),
    [store]
  )
  const autosave = useFileAutosave({
    tabId,
    queryKey,
    write: (diagram: SoarDiagram) => ipcClient.fs.writeDiagram(filePath, diagram),
    build,
    onSaved: (saved) => store?.getState().setBase(saved)
  })

  useEffect(() => {
    if (!store) return
    return store.subscribe((state, prev) => {
      if (state.revision !== prev.revision) autosave.markChanged()
    })
  }, [store, autosave])

  useExternalChanges({
    tabId,
    latest: data,
    // Kept in the store, so it survives tab switches.
    getBase: () => store?.getState().base ?? undefined,
    ready: store !== null,
    name: (version) => version.title || filePath,
    apply: (version) => {
      store?.getState().replaceGraph(fileToGraph(version))
      store?.getState().setBase(version)
      autosave.discard()
    }
  })

  return { store, error: store ? null : error }
}
