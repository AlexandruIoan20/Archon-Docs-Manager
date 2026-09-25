import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '@/shared/components/icons'
import { computeSubmenuPosition } from '@/shared/utils/floating-position'
import type { ContextMenuAction, ContextMenuEntry, ContextMenuSubmenu } from './context-menu.types'
import { MenuItem } from './Menu'

const ITEMS = '[role="menuitem"]:not([disabled])'

function focusItem(root: HTMLElement | null, index: number | 'first' | 'last'): void {
  const items = Array.from(root?.querySelectorAll<HTMLElement>(ITEMS) ?? [])
  const target = index === 'first' ? items[0] : index === 'last' ? items.at(-1) : items[index]
  target?.focus()
}

function Submenu({ entry }: { entry: ContextMenuSubmenu }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const itemRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const item = itemRef.current
    if (!open || !list || !item) return
    const rect = item.getBoundingClientRect()
    const { x, y } = computeSubmenuPosition(
      { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      { width: list.offsetWidth, height: list.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }
    )
    list.style.left = `${x}px`
    list.style.top = `${y}px`
    list.style.visibility = 'visible'
  }, [open])

  const openAndFocus = (): void => {
    setOpen(true)
    requestAnimationFrame(() => focusItem(listRef.current, 'first'))
  }

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // The parent menu must not move its own focus meanwhile.
    event.stopPropagation()
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(ITEMS) ?? [])
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') focusItem(listRef.current, (current + 1) % items.length)
    else if (event.key === 'ArrowUp')
      focusItem(listRef.current, (current - 1 + items.length) % items.length)
    else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      setOpen(false)
      itemRef.current?.focus()
    } else return
    event.preventDefault()
  }

  return (
    <div onMouseLeave={() => setOpen(false)}>
      <button
        ref={itemRef}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseEnter={(event) => {
          event.currentTarget.focus()
          setOpen(true)
        }}
        onClick={openAndFocus}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowRight' && event.key !== 'Enter') return
          event.preventDefault()
          event.stopPropagation()
          openAndFocus()
        }}
        className="flex h-7 w-full shrink-0 cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-[12px] text-fg outline-none hover:bg-surface-2 focus:bg-surface-2"
      >
        {entry.icon && <Icon name={entry.icon} size={14} className="shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
        <Icon name="chevR" size={12} className="shrink-0 text-fg-subtle" />
      </button>
      {open && (
        <div
          ref={listRef}
          role="menu"
          aria-label={entry.label}
          onKeyDown={onListKeyDown}
          style={{ visibility: 'hidden' }}
          className="fixed z-40 flex w-44 flex-col rounded-md border border-border bg-surface p-1 shadow-menu"
        >
          {entry.items.map((item) => (
            <Action key={item.label} entry={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function Action({ entry }: { entry: ContextMenuAction }): React.JSX.Element {
  return (
    <MenuItem
      icon={entry.icon}
      suffix={entry.suffix}
      danger={entry.danger}
      disabled={entry.disabled}
      title={entry.title}
      onSelect={entry.onSelect}
    >
      {entry.label}
    </MenuItem>
  )
}

/** The entries of a context menu: actions, separators and submenus. */
export function ContextMenuList({
  items
}: {
  items: readonly ContextMenuEntry[]
}): React.JSX.Element {
  return (
    <>
      {items.map((entry, i) =>
        entry.type === 'separator' ? (
          <div key={`separator-${i}`} role="separator" className="my-1 h-px shrink-0 bg-border" />
        ) : entry.type === 'submenu' ? (
          <Submenu key={entry.label} entry={entry} />
        ) : (
          <Action key={entry.label} entry={entry} />
        )
      )}
    </>
  )
}
