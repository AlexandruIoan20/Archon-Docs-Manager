import type { ReactNode } from 'react'
import { useTreeKeyboard, type TreeKeyboardActions } from '../hooks/useTreeKeyboard'
import type { TreeRow } from '../utils/flatten-tree'
import { FileTreeNode } from './FileTreeNode'

export interface FileTreeProps extends TreeKeyboardActions {
  rows: readonly TreeRow[]
  query: string
  /** Custom name cell for a row (inline rename); `undefined` keeps the default. */
  renderName?: (row: TreeRow) => ReactNode | undefined
}

/**
 * The file tree as a flat list of rows. Plain rendering is fine for a few
 * hundred rows; past ~500 this is the place to add virtualization.
 */
export function FileTree({
  rows,
  query,
  renderName,
  ...actions
}: FileTreeProps): React.JSX.Element {
  const keyboard = useTreeKeyboard(rows, actions)

  if (rows.length === 0 && query.trim() !== '') {
    return (
      <p className="px-2.5 py-5 text-center text-[12px] text-fg-subtle">
        No files match “{query.trim()}”
      </p>
    )
  }

  // Keep one row reachable with Tab even when the focused row disappeared.
  const focusable = rows.some((row) => row.entry.relPath === keyboard.focusedPath)
    ? keyboard.focusedPath
    : (rows.find((row) => row.type === 'file' && row.isActive) ?? rows[0])?.entry.relPath

  return (
    <div role="tree" aria-label="Files" className="min-w-full">
      {rows.map((row, index) => (
        <FileTreeNode
          key={row.entry.relPath}
          row={row}
          rowRef={keyboard.registerRow(row.entry.relPath)}
          tabbable={row.entry.relPath === focusable}
          onActivate={(clicked) => {
            keyboard.setFocusedPath(clicked.entry.relPath)
            actions.onActivate(clicked)
          }}
          onFocus={() => keyboard.setFocusedPath(row.entry.relPath)}
          onKeyDown={(event) => keyboard.onKeyDown(event, index)}
          onRename={actions.onRename}
          nameSlot={renderName?.(row)}
        />
      ))}
    </div>
  )
}
