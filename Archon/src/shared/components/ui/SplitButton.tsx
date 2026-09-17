import { useId, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { Menu } from './Menu'

export interface SplitButtonProps {
  label: string
  icon?: IconName
  onPrimary: () => void
  /** `MenuItem`s shown by the chevron. */
  menu: ReactNode
  menuLabel: string
  className?: string
}

const PART_CLASSES =
  'inline-flex h-[30px] cursor-pointer items-center bg-accent text-on-accent transition-[filter] hover:brightness-110'

export function SplitButton({
  label,
  icon,
  onPrimary,
  menu,
  menuLabel,
  className
}: SplitButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  return (
    <div ref={groupRef} className={cn('flex min-w-0', className)}>
      <button
        type="button"
        onClick={onPrimary}
        className={cn(
          PART_CLASSES,
          'min-w-0 flex-1 justify-center gap-1.5 rounded-l-sm px-3 text-[12px] font-semibold'
        )}
      >
        {icon && <Icon name={icon} size={14} className="shrink-0" />}
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(PART_CLASSES, 'w-7 shrink-0 justify-center rounded-r-sm brightness-[.88]')}
      >
        <Icon name="chevD" size={13} />
      </button>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchor={groupRef}
        placement="bottom-start"
        matchAnchorWidth
        id={menuId}
        aria-label={menuLabel}
      >
        {menu}
      </Menu>
    </div>
  )
}
