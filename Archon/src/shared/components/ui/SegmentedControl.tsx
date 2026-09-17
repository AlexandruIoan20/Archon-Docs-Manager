import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: IconName
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** `tabs`: Files/Diagrams switch. `pills`: compact choice ("saves to"). */
  variant?: 'tabs' | 'pills'
  'aria-label': string
  className?: string
}

const NEXT_KEYS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1
}

const STYLES = {
  tabs: {
    container: 'flex gap-1',
    option: 'h-7 flex-1 gap-1.5 rounded-sm text-[12px] font-medium',
    active: 'bg-surface text-fg',
    inactive: 'text-fg-muted hover:text-fg'
  },
  pills: {
    container: 'inline-flex gap-0.5 rounded-sm border border-border bg-surface-2 p-[2px]',
    option: 'h-[22px] shrink-0 gap-1 rounded-xs px-2 text-[11px]',
    active: 'bg-accent-soft text-accent-fg',
    inactive: 'text-fg-muted hover:text-fg'
  }
} as const

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'tabs',
  className,
  ...aria
}: SegmentedControlProps<T>): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null)
  const styles = STYLES[variant]
  const isTabs = variant === 'tabs'

  // Arrow keys move focus and select (automatic activation), skipping disabled options.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const enabled = options.filter((option) => !option.disabled)
    const current = enabled.findIndex((option) => option.value === value)
    let next: number
    if (event.key in NEXT_KEYS)
      next = (current + NEXT_KEYS[event.key] + enabled.length) % enabled.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = enabled.length - 1
    else return

    event.preventDefault()
    const target = enabled[next]
    if (!target) return
    onChange(target.value)
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-value]') ?? []
    Array.from(buttons)
      .find((button) => button.dataset.value === target.value)
      ?.focus()
  }

  return (
    <div
      ref={listRef}
      role={isTabs ? 'tablist' : 'radiogroup'}
      aria-label={aria['aria-label']}
      onKeyDown={onKeyDown}
      className={cn(styles.container, className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role={isTabs ? 'tab' : 'radio'}
            aria-selected={isTabs ? selected : undefined}
            aria-checked={isTabs ? undefined : selected}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-w-0 cursor-pointer items-center justify-center whitespace-nowrap transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              styles.option,
              selected ? styles.active : styles.inactive
            )}
          >
            {option.icon && <Icon name={option.icon} size={13} className="shrink-0" />}
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
