import { useRef, useState } from 'react'
import type { EditorTab } from '@/store'
import { IconButton, Menu, MenuItem } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'

export interface TabOverflowMenuProps {
  tabs: readonly EditorTab[]
  activeId: string | null
  onActivate: (id: string) => void
}

/** Chevron with every open tab, shown when the tab strip overflows. */
export function TabOverflowMenu({
  tabs,
  activeId,
  onActivate
}: TabOverflowMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon="chevD"
        label="All tabs"
        size="md"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchor={anchorRef}
        placement="bottom-end"
        width={260}
        aria-label="Open tabs"
        className="max-h-[min(420px,70vh)]"
      >
        {tabs.map((tab) => (
          <MenuItem
            key={tab.id}
            icon={tab.kind === 'soardiag' ? 'flow' : 'file'}
            onSelect={() => onActivate(tab.id)}
            className={cn(tab.id === activeId && 'font-semibold text-accent')}
            suffix={
              tab.dirty ? (
                <span
                  aria-label="Unsaved changes"
                  className="inline-block size-[5px] rounded-full bg-accent"
                />
              ) : undefined
            }
          >
            {tab.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
