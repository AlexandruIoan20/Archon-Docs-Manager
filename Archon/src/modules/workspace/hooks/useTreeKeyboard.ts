import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { parentRowIndex, type TreeRow } from '../utils/flatten-tree'

export interface TreeKeyboardActions {
  onActivate: (row: TreeRow) => void
  onExpand: (relPath: string, expanded: boolean) => void
  /** F2 (plan 09). */
  onRename?: (row: TreeRow) => void
  /** Delete / Backspace (plan 09). */
  onDelete?: (row: TreeRow) => void
}

export interface TreeKeyboard {
  /** The row that owns the roving tab stop. */
  focusedPath: string | null
  setFocusedPath: (relPath: string) => void
  registerRow: (relPath: string) => (element: HTMLDivElement | null) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void
}

/**
 * WAI-ARIA tree navigation: ↑/↓ move, → expands or enters, ← collapses or
 * climbs, Enter activates, Home/End jump.
 */
export function useTreeKeyboard(
  rows: readonly TreeRow[],
  actions: TreeKeyboardActions
): TreeKeyboard {
  const [focusedPath, setFocusedPath] = useState<string | null>(null)
  const elements = useRef(new Map<string, HTMLDivElement>())

  const registerRow = useCallback(
    (relPath: string) => (element: HTMLDivElement | null) => {
      if (element) elements.current.set(relPath, element)
      else elements.current.delete(relPath)
    },
    []
  )

  const focusIndex = (index: number): void => {
    const row = rows[Math.max(0, Math.min(index, rows.length - 1))]
    if (!row) return
    setFocusedPath(row.entry.relPath)
    elements.current.get(row.entry.relPath)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number): void => {
    const row = rows[index]
    if (!row || event.target !== event.currentTarget) return
    const folder = row.type === 'folder' ? row : null

    switch (event.key) {
      case 'ArrowDown':
        focusIndex(index + 1)
        break
      case 'ArrowUp':
        focusIndex(index - 1)
        break
      case 'Home':
        focusIndex(0)
        break
      case 'End':
        focusIndex(rows.length - 1)
        break
      case 'ArrowRight':
        if (!folder) return
        if (!folder.expanded) actions.onExpand(folder.entry.relPath, true)
        else if ((rows[index + 1]?.depth ?? -1) > row.depth) focusIndex(index + 1)
        break
      case 'ArrowLeft':
        if (folder?.expanded) actions.onExpand(folder.entry.relPath, false)
        else if (parentRowIndex(rows, index) !== -1) focusIndex(parentRowIndex(rows, index))
        break
      case 'Enter':
        actions.onActivate(row)
        break
      case 'F2':
        if (!actions.onRename) return
        actions.onRename(row)
        break
      case 'Delete':
      case 'Backspace':
        if (!actions.onDelete) return
        actions.onDelete(row)
        break
      default:
        return
    }
    event.preventDefault()
  }

  return { focusedPath, setFocusedPath, registerRow, onKeyDown }
}
