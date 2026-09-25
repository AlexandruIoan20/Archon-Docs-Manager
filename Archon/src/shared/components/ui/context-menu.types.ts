import type { IconName } from '@/shared/components/icons'

export interface ContextMenuAction {
  type?: 'item'
  label: string
  icon?: IconName
  suffix?: string
  danger?: boolean
  disabled?: boolean
  /** Why it is disabled, as a tooltip. */
  title?: string
  onSelect: () => void
}

export interface ContextMenuSubmenu {
  type: 'submenu'
  label: string
  icon?: IconName
  items: ContextMenuAction[]
}

export type ContextMenuEntry = ContextMenuAction | ContextMenuSubmenu | { type: 'separator' }

export interface ContextMenuPoint {
  clientX: number
  clientY: number
  preventDefault?: () => void
}
