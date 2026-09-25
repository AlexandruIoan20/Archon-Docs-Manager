import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '@/shared/components/icons'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useEscape } from '@/shared/hooks/useEscape'
import { useFloatingPosition, type FloatingAnchor } from '@/shared/hooks/useFloatingPosition'
import type { FloatingPlacement } from '@/shared/utils/floating-position'
import { cn } from '@/shared/utils/cn'

const MenuContext = createContext<{ close: () => void } | null>(null)

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])'

export interface MenuProps {
  open: boolean
  onClose: () => void
  /** An element ref, or a viewport point (context menus). */
  anchor: FloatingAnchor
  placement?: FloatingPlacement
  width?: number
  matchAnchorWidth?: boolean
  id?: string
  'aria-label': string
  className?: string
  children: ReactNode
}

export function Menu({
  open,
  onClose,
  anchor,
  placement = 'bottom-start',
  width,
  matchAnchorWidth,
  id,
  className,
  children,
  ...aria
}: MenuProps): React.JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null)
  const anchorRef = 'current' in anchor ? anchor : null

  useFloatingPosition(menuRef, {
    open,
    anchor,
    placement,
    offset: anchorRef ? 4 : 0,
    matchAnchorWidth
  })
  useClickOutside(anchorRef ? [menuRef, anchorRef] : [menuRef], onClose, open)
  useEscape(() => {
    onClose()
    anchorRef?.current?.focus()
  }, open)

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus()
  }, [open])

  if (!open) return null

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') {
      onClose()
      return
    }
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])
    if (items.length === 0) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    const last = items.length - 1
    const next: Record<string, number> = {
      ArrowDown: current < last ? current + 1 : 0,
      ArrowUp: current > 0 ? current - 1 : last,
      Home: 0,
      End: last
    }
    if (!(event.key in next)) return
    event.preventDefault()
    items[next[event.key]]?.focus()
  }

  return createPortal(
    <MenuContext.Provider value={{ close: onClose }}>
      <div
        ref={menuRef}
        id={id}
        role="menu"
        aria-label={aria['aria-label']}
        onKeyDown={onKeyDown}
        style={{ visibility: 'hidden', width }}
        className={cn(
          'fixed z-40 flex max-w-[calc(100vw-16px)] flex-col overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-menu',
          className
        )}
      >
        {children}
      </div>
    </MenuContext.Provider>,
    document.body
  )
}

export interface MenuItemProps {
  children: ReactNode
  onSelect?: () => void
  icon?: IconName
  /** Right-aligned mono hint, e.g. a file extension or shortcut. */
  suffix?: ReactNode
  danger?: boolean
  disabled?: boolean
  /** Keeps the menu open after selection (toggles, pickers). */
  keepOpen?: boolean
  /** Native tooltip, e.g. why the item is disabled. */
  title?: string
  className?: string
}

export function MenuItem({
  children,
  onSelect,
  icon,
  suffix,
  danger = false,
  disabled = false,
  keepOpen = false,
  title,
  className
}: MenuItemProps): React.JSX.Element {
  const menu = useContext(MenuContext)

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      title={title}
      onMouseEnter={(event) => event.currentTarget.focus()}
      onClick={() => {
        onSelect?.()
        if (!keepOpen) menu?.close()
      }}
      className={cn(
        'flex h-7 w-full shrink-0 cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-[12px] outline-none',
        'hover:bg-surface-2 focus:bg-surface-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        danger ? 'text-danger' : 'text-fg',
        className
      )}
    >
      {icon && <Icon name={icon} size={14} className="shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {suffix && <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{suffix}</span>}
    </button>
  )
}
