import { useState, type ReactNode } from 'react'
import type { ContextMenuEntry, ContextMenuPoint } from './context-menu.types'
import { ContextMenuList } from './ContextMenuList'
import { Menu } from './Menu'

interface OpenState {
  x: number
  y: number
  label: string
  items: readonly ContextMenuEntry[]
}

export interface ContextMenuControls {
  /** Opens at the pointer (a `contextmenu` event, or any point). */
  open: (point: ContextMenuPoint, items: readonly ContextMenuEntry[], label?: string) => void
  close: () => void
  /** Render it once, anywhere: the menu is portalled. */
  element: ReactNode
}

/**
 * A right-click menu at the pointer, built on `Menu`: it stays inside the
 * window, closes on Escape or a click outside, and moves with the arrow keys.
 */
export function useContextMenu(): ContextMenuControls {
  const [state, setState] = useState<OpenState | null>(null)
  const close = (): void => setState(null)

  const open: ContextMenuControls['open'] = (point, items, label = 'Context menu') => {
    point.preventDefault?.()
    if (items.length === 0) return
    setState({ x: point.clientX, y: point.clientY, label, items })
  }

  const element = (
    <Menu
      open={state !== null}
      onClose={close}
      anchor={state ? { x: state.x, y: state.y } : { x: 0, y: 0 }}
      placement="bottom-start"
      width={210}
      aria-label={state?.label ?? 'Context menu'}
    >
      {state && <ContextMenuList items={state.items} />}
    </Menu>
  )

  return { open, close, element }
}
