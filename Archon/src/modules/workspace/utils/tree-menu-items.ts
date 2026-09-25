import type { ShortcutId } from '@/core/constants/shortcuts'
import type { ContextMenuEntry } from '@/shared/components/ui'
import type { TreeRow } from './flatten-tree'

export interface TreeMenuActions {
  open: (row: TreeRow) => void
  /** In the row's folder: it becomes the target first. */
  newDocument: (folder: string) => void
  newDiagram: (folder: string) => void
  newFolder: (folder: string) => void
  rename: (row: TreeRow) => void
  reveal: (row: TreeRow) => void
  copyPath: (row: TreeRow) => void
  remove: (row: TreeRow) => void
  /** A registry shortcut as shown. */
  keys: (id: ShortcutId) => string
}

/** The right-click menu of a tree row: create inside (folders), rename, reveal, copy, delete. */
export function treeMenuItems(row: TreeRow, actions: TreeMenuActions): ContextMenuEntry[] {
  const folder = row.entry.relPath
  const top: ContextMenuEntry[] =
    row.type === 'folder'
      ? [
          { label: 'New document', icon: 'file', onSelect: () => actions.newDocument(folder) },
          { label: 'New diagram…', icon: 'flow', onSelect: () => actions.newDiagram(folder) },
          { label: 'New folder', icon: 'folder', onSelect: () => actions.newFolder(folder) }
        ]
      : [
          {
            label: 'Open',
            icon: row.entry.kind === 'ardiag' ? 'flow' : 'file',
            onSelect: () => actions.open(row)
          }
        ]
  return [
    ...top,
    { type: 'separator' },
    { label: 'Rename', suffix: actions.keys('tree.rename'), onSelect: () => actions.rename(row) },
    { label: 'Reveal in file manager', onSelect: () => actions.reveal(row) },
    { label: 'Copy relative path', onSelect: () => actions.copyPath(row) },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'trash',
      danger: true,
      suffix: actions.keys('tree.delete'),
      onSelect: () => actions.remove(row)
    }
  ]
}
