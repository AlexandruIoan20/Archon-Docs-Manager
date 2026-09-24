import type { FileEntry, FolderEntry, TreeEntry } from '@/core/types'
import type { SideTab } from '@/store'

export interface FolderRow {
  type: 'folder'
  entry: FolderEntry
  depth: number
  expanded: boolean
  isTarget: boolean
  /** Visible files below this folder, recursively. */
  fileCount: number
}

export interface FileRow {
  type: 'file'
  entry: FileEntry
  depth: number
  isActive: boolean
}

export type TreeRow = FolderRow | FileRow

export interface FlattenOptions {
  expanded: Readonly<Record<string, boolean>>
  query: string
  sideTab: SideTab
  activePath: string | null
  targetFolder: string
}

type FilePredicate = (file: FileEntry) => boolean

/** Which files the tab and the search let through. */
export function fileFilter(sideTab: SideTab, query: string): FilePredicate {
  const needle = query.trim().toLowerCase()
  return (file) =>
    (sideTab === 'files' || file.kind === 'soardiag') &&
    (needle === '' || file.baseName.toLowerCase().includes(needle))
}

export function countFiles(entry: TreeEntry, visible: FilePredicate): number {
  if (entry.kind !== 'folder') return visible(entry) ? 1 : 0
  return entry.children.reduce((sum, child) => sum + countFiles(child, visible), 0)
}

/**
 * Turns the tree into the rows to render, top to bottom. The root folder itself
 * is not a row. While searching, folders without matches are hidden and the
 * others are shown expanded, whatever their saved state.
 */
export function flattenTree(root: FolderEntry, options: FlattenOptions): TreeRow[] {
  const visible = fileFilter(options.sideTab, options.query)
  const searching = options.query.trim() !== ''
  const rows: TreeRow[] = []

  const walk = (folder: FolderEntry, depth: number): void => {
    for (const child of folder.children) {
      if (child.kind !== 'folder') {
        if (visible(child)) {
          rows.push({
            type: 'file',
            entry: child,
            depth,
            isActive: child.relPath === options.activePath
          })
        }
        continue
      }

      const fileCount = countFiles(child, visible)
      if (searching && fileCount === 0) continue
      const expanded = searching || Boolean(options.expanded[child.relPath])
      rows.push({
        type: 'folder',
        entry: child,
        depth,
        expanded,
        isTarget: child.relPath === options.targetFolder,
        fileCount
      })
      if (expanded) walk(child, depth + 1)
    }
  }

  walk(root, 0)
  return rows
}

/** Index of the closest folder row above `index` that is one level up. */
export function parentRowIndex(rows: readonly TreeRow[], index: number): number {
  const depth = rows[index]?.depth ?? 0
  for (let i = index - 1; i >= 0; i--) {
    if ((rows[i]?.depth ?? 0) < depth) return i
  }
  return -1
}
