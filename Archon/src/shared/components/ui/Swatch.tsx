import { cn } from '@/shared/utils/cn'

export interface SwatchProps {
  color: string
  /** Human-readable color name, used as the accessible name. */
  label: string
  selected?: boolean
  onSelect: (color: string) => void
  className?: string
}

const SELECTED_RING = '0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)'

export function Swatch({
  color,
  label,
  selected = false,
  onSelect,
  className
}: SwatchProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={() => onSelect(color)}
      style={{ backgroundColor: color, boxShadow: selected ? SELECTED_RING : undefined }}
      className={cn('size-[22px] shrink-0 cursor-pointer rounded-full', className)}
    />
  )
}
