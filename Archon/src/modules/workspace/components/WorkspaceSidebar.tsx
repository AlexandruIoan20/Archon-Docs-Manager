import { useMemo } from 'react'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { useFileActions } from '../hooks/useFileActions'
import { useWorkspaceActions, useWorkspaceTree } from '../hooks/useWorkspace'
import { flattenTree, type TreeRow } from '../utils/flatten-tree'
import { FileTree } from './FileTree'
import { InlineRename } from './InlineRename'
import { NewMenu } from './NewMenu'
import { SidebarFooter } from './SidebarFooter'
import { SidebarTabs } from './SidebarTabs'
import { WorkspaceHeader } from './WorkspaceHeader'

export interface WorkspaceSidebarProps {
  onToggleInspector: () => void
  /** Opens the "New diagram" dialog; without it an empty flowchart is created. */
  onNewDiagram?: () => void
}

/** Sidebar content: workspace header, Files/Diagrams, New, the tree and search. */
export function WorkspaceSidebar({
  onToggleInspector,
  onNewDiagram
}: WorkspaceSidebarProps): React.JSX.Element | null {
  const workspace = useWorkspaceStore((s) => s.current)
  const expanded = useWorkspaceStore((s) => s.expanded)
  const targetFolder = useWorkspaceStore((s) => s.targetFolder)
  const sideTab = useWorkspaceStore((s) => s.sideTab)
  const query = useWorkspaceStore((s) => s.query)
  const renaming = useWorkspaceStore((s) => s.renaming)
  const store = useWorkspaceStore.getState()
  const activePath = useEditorStore((s) => s.activePath)
  const { openModal, closeOverlays } = useUiStore.getState()
  const actions = useWorkspaceActions()
  const files = useFileActions()
  const { tree, isLoading } = useWorkspaceTree()

  const rows = useMemo(
    () => (tree ? flattenTree(tree, { expanded, query, sideTab, activePath, targetFolder }) : []),
    [tree, expanded, query, sideTab, activePath, targetFolder]
  )

  if (!workspace) return null

  const activate = (row: TreeRow): void => {
    if (row.type === 'folder') {
      // A folder click both toggles it and makes it the "saves to" folder.
      store.toggleExpanded(row.entry.relPath)
      store.setTargetFolder(row.entry.relPath)
      return
    }
    useEditorStore.getState().openFile(row.entry.relPath, row.entry.kind)
    closeOverlays()
  }

  const requestDelete = (row: TreeRow): void => {
    store.setPendingDelete({
      relPath: row.entry.relPath,
      name: row.entry.name,
      isFolder: row.type === 'folder'
    })
    openModal('confirm-delete')
  }

  const renderName = (row: TreeRow): React.JSX.Element | undefined =>
    row.entry.relPath === renaming ? (
      <InlineRename
        initialName={row.type === 'folder' ? row.entry.name : row.entry.baseName}
        onSubmit={(name) => files.rename(row.entry.relPath, name)}
        onDone={() => store.setRenaming(null)}
      />
    ) : undefined

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceHeader workspace={workspace} actions={actions} />
      <SidebarTabs value={sideTab} onChange={store.setSideTab} />
      <NewMenu
        // TODO(plan-17): always open the "New diagram" dialog.
        onNewDiagram={onNewDiagram ?? (() => void files.newDiagram('flowchart'))}
        onNewDocument={() => void files.newDocument()}
        onNewFolder={() => void files.newFolder()}
      />
      <div className="min-h-0 flex-1 overflow-auto px-1.5 pb-2">
        {isLoading ? (
          <p className="px-2.5 py-5 text-center text-[12px] text-fg-subtle">Loading…</p>
        ) : (
          <FileTree
            rows={rows}
            query={query}
            onActivate={activate}
            onExpand={store.setExpanded}
            onRename={(row) => store.setRenaming(row.entry.relPath)}
            onDelete={requestDelete}
            renderName={renderName}
          />
        )}
      </div>
      <SidebarFooter
        query={query}
        onQueryChange={store.setQuery}
        onToggleInspector={onToggleInspector}
      />
    </div>
  )
}
