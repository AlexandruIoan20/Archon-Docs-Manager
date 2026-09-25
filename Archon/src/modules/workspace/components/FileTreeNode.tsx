import type { KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react'
import { Icon } from '@/shared/components/icons'
import { TruncatedText } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import type { TreeRow } from '../utils/flatten-tree'
import { TREE_INDENT, TREE_PADDING, TreeGuides } from './TreeGuides'

export interface FileTreeNodeProps {
  row: TreeRow
  /** Roving tab stop: only one row is reachable with Tab. */
  tabbable: boolean
  onActivate: (row: TreeRow) => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  /** Double-click starts an inline rename. */
  onRename?: (row: TreeRow) => void
  /** Right click (plan 20). */
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
  /** Replaces the name, e.g. with an inline rename field (plan 09). */
  nameSlot?: ReactNode
  rowRef?: Ref<HTMLDivElement>
}

// Deep rows widen the tree so it scrolls on its own instead of squeezing names to nothing.
const MIN_NAME_WIDTH = 120

const TARGET_BG = 'bg-[color-mix(in_oklab,var(--accent-soft)_60%,transparent)]'

export function FileTreeNode({
  row,
  tabbable,
  onActivate,
  onFocus,
  onKeyDown,
  onRename,
  onContextMenu,
  nameSlot,
  rowRef
}: FileTreeNodeProps): React.JSX.Element {
  const folder = row.type === 'folder'
  const highlighted = folder ? row.isTarget : row.isActive
  const displayName = folder ? row.entry.name : row.entry.baseName

  return (
    <div
      ref={rowRef}
      role="treeitem"
      aria-level={row.depth + 1}
      aria-expanded={folder ? row.expanded : undefined}
      aria-selected={highlighted}
      aria-label={displayName}
      data-path={row.entry.relPath}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => onActivate(row)}
      onDoubleClick={onRename ? () => onRename(row) : undefined}
      onContextMenu={onContextMenu}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      style={{
        paddingLeft: TREE_PADDING + row.depth * TREE_INDENT,
        minWidth: TREE_PADDING + row.depth * TREE_INDENT + MIN_NAME_WIDTH
      }}
      className={cn(
        'relative flex h-[26px] cursor-pointer items-center gap-1.5 rounded-sm pr-2 text-[13px] outline-none',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
        folder
          ? cn('text-fg', row.isTarget ? TARGET_BG : 'hover:bg-surface-2')
          : row.isActive
            ? 'bg-accent-soft text-fg shadow-[inset_2px_0_0_var(--accent)]'
            : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
      )}
    >
      <TreeGuides depth={row.depth} />
      {folder ? (
        <>
          <Icon
            name={row.expanded ? 'chevD' : 'chevR'}
            size={12}
            className="shrink-0 text-fg-muted"
          />
          <Icon
            name="folder"
            size={14}
            className={cn('shrink-0', row.isTarget ? 'text-accent' : 'text-fg-muted')}
          />
        </>
      ) : (
        <>
          <span aria-hidden className="w-3 shrink-0" />
          <Icon
            name={row.entry.kind === 'ardiag' ? 'flow' : 'file'}
            size={14}
            className={cn('shrink-0', row.isActive ? 'text-accent' : 'text-fg-muted')}
          />
        </>
      )}
      {nameSlot ?? <TruncatedText className="flex-1">{displayName}</TruncatedText>}
      {folder && (
        <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{row.fileCount}</span>
      )}
    </div>
  )
}
