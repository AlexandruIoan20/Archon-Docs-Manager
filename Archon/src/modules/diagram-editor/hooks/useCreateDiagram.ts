import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DiagramEngine, EntryRef, UmlDiagramType } from '@/core/types'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { catalogEntry } from '../constants/diagram-catalog'
import { mermaidTemplate } from '../mermaid/templates'
import { buildStarterGraph } from '../utils/build-starter-graph'

export interface CreateDiagramRequest {
  type: UmlDiagramType
  /** Relative folder; `''` is the root. */
  folder: string
  /** `mermaid`: a text diagram from the type's template (see `supportsMermaid`). */
  engine?: DiagramEngine
}

export interface CreateDiagram {
  create: (request: CreateDiagramRequest) => Promise<EntryRef | null>
  pending: boolean
}

/** `Playbooks/` for a folder, `<workspace root>/` at the top level. */
function folderLabel(folder: string): string {
  return `${folder || (useWorkspaceStore.getState().current?.rootName ?? '')}/`
}

/**
 * Creates `<type>-N.ardiag` in `folder`, with its starter nodes (or its
 * Mermaid template), then shows it: the folder expands, the tab opens with N1
 * selected, a toast confirms.
 */
export function useCreateDiagram(): CreateDiagram {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ type, folder, engine = 'react-flow' }: CreateDiagramRequest) => {
      const source = engine === 'mermaid' ? mermaidTemplate(type) : null
      return ipcClient.fs.createDiagram(
        folder,
        source === null
          ? { type, ...buildStarterGraph(type) }
          : { type, engine: 'mermaid', mermaidSource: source }
      )
    }
  })

  const create = async (request: CreateDiagramRequest): Promise<EntryRef | null> => {
    const { notify } = useUiStore.getState()
    let created: EntryRef
    try {
      created = await mutation.mutateAsync(request)
    } catch (error) {
      notify((error as Error).message, 'error')
      return null
    }

    const workspace = useWorkspaceStore.getState()
    if (request.folder) workspace.setExpanded(request.folder, true)
    if (workspace.current) {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.workspaceTree, workspace.current.id]
      })
    }
    const editor = useEditorStore.getState()
    const tabId = editor.openFile(created.relPath, 'ardiag')
    if (request.engine !== 'mermaid') editor.setPendingSelection(tabId, ['N1'])
    notify(`${catalogEntry(request.type).name} diagram created in ${folderLabel(request.folder)}`)
    return created
  }

  return { create, pending: mutation.isPending }
}
