import { Icon, type IconName } from '@/shared/components/icons'
import { SegmentedControl } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { DIAGRAM_CATEGORIES } from '../../constants/diagram-catalog'
import { categoryCounts, type CategoryFilter } from '../../utils/filter-catalog'

export interface CategoryListProps {
  value: CategoryFilter
  onChange: (value: CategoryFilter) => void
  /** `column` beside the grid; `tabs` under the header on a narrow dialog. */
  variant: 'column' | 'tabs'
  className?: string
}

const COUNTS = categoryCounts()

const OPTIONS = [
  { value: 'all', label: 'All UML types', short: 'All', icon: 'grid4' },
  ...DIAGRAM_CATEGORIES.map((c) => ({ value: c.id, label: c.label, short: c.label, icon: c.icon }))
] as const satisfies readonly {
  value: CategoryFilter
  label: string
  short: string
  icon: IconName
}[]

/** The categories with their counters. Both variants render; CSS shows one. */
export function CategoryList({
  value,
  onChange,
  variant,
  className
}: CategoryListProps): React.JSX.Element {
  if (variant === 'tabs') {
    return (
      <SegmentedControl
        aria-label="Category"
        value={value}
        onChange={onChange}
        className={className}
        options={OPTIONS.map((option) => ({
          value: option.value,
          ariaLabel: `${option.label} (${COUNTS[option.value]})`,
          label: (
            <>
              {option.short} <span className="font-mono text-[10px]">{COUNTS[option.value]}</span>
            </>
          )
        }))}
      />
    )
  }

  return (
    <nav
      aria-label="Category"
      className={cn(
        'w-[190px] shrink-0 flex-col gap-0.5 border-r border-border bg-side px-2 py-3',
        className
      )}
    >
      <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-[.6px] text-fg-subtle uppercase">
        Category
      </div>
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-[30px] cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-[12px]',
              active
                ? 'bg-accent-soft text-fg shadow-[inset_2px_0_0_var(--accent)]'
                : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
            )}
          >
            <Icon name={option.icon} size={14} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            <span
              className={cn('font-mono text-[10px]', active ? 'text-accent-fg' : 'text-fg-subtle')}
            >
              {COUNTS[option.value]}
            </span>
          </button>
        )
      })}
      <p className="mt-auto border-t border-border px-2 pt-2.5 text-[11px] leading-[1.5] text-fg-muted">
        Every type starts with its UML 2.5 notation and two linked starter nodes.
      </p>
    </nav>
  )
}
