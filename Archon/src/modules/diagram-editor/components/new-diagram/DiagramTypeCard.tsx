import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import type { DiagramCatalogEntry } from '../../constants/diagram-catalog'
import { DiagramSketch } from './DiagramSketch'

export interface DiagramTypeCardProps {
  entry: DiagramCatalogEntry
  selected: boolean
  onSelect: () => void
  /** Double-click: select and create. */
  onCreate: () => void
}

const SELECTED_GLOW = 'shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]'

/** One type of the grid: sketch, name, description; an option of the listbox. */
export function DiagramTypeCard({
  entry,
  selected,
  onSelect,
  onCreate
}: DiagramTypeCardProps): React.JSX.Element {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-type={entry.id}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onDoubleClick={onCreate}
      className={cn(
        'relative cursor-pointer rounded-md border bg-surface-2 p-2 transition-colors outline-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected ? cn('border-accent', SELECTED_GLOW) : 'border-border hover:border-accent-border'
      )}
    >
      <DiagramSketch type={entry.id} selected={selected} />
      <div className="truncate text-[12px] font-semibold text-fg">{entry.name}</div>
      <div className="mt-0.5 line-clamp-2 text-[10px] leading-[1.4] text-fg-muted">
        {entry.description}
      </div>
      {selected && (
        <span
          aria-hidden
          className="absolute -top-[7px] -right-[7px] inline-flex size-[18px] items-center justify-center rounded-full bg-accent text-on-accent"
        >
          <Icon name="check" size={11} strokeWidth={2.4} />
        </span>
      )}
    </div>
  )
}
