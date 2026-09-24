import { useRef, useState } from 'react'
import type { IconName } from '@/shared/components/icons'
import { Icon } from '@/shared/components/icons'
import { IconButton, Menu, MenuItem } from '@/shared/components/ui'
import type { FormatItem } from './format-groups'

export interface FormatMenuProps {
  label: string
  icon: IconName
  items: readonly FormatItem[]
  /** Ids of the active items; the button shows active if any is. */
  active: ReadonlySet<string>
  onRun: (item: FormatItem) => void
}

/** A group of formats folded into one button (title bar `minimal`). */
export function FormatMenu({
  label,
  icon,
  items,
  active,
  onRun
}: FormatMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon={icon}
        label={label}
        active={items.some((item) => active.has(item.id))}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
      />
      <Menu open={open} onClose={() => setOpen(false)} anchor={anchorRef} aria-label={label}>
        {items.map((item) => (
          <MenuItem
            key={item.id}
            icon={item.icon}
            onSelect={() => onRun(item)}
            suffix={active.has(item.id) ? <Icon name="check" size={12} /> : undefined}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
