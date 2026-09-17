import type { KeyboardEvent } from 'react'
import { cn } from '@/shared/utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name, unless `aria-labelledby` points to a visible label. */
  label?: string
  'aria-labelledby'?: string
  id?: string
  disabled?: boolean
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
  ...aria
}: ToggleProps): React.JSX.Element {
  // Space is handled on keydown for instant feedback; the native keyup click
  // is suppressed so the switch does not toggle twice.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== ' ') return
    event.preventDefault()
    if (!disabled) onChange(!checked)
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === ' ') event.preventDefault()
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      className={cn(
        'relative h-[17px] w-[30px] shrink-0 cursor-pointer rounded-[9px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-border',
        className
      )}
      {...aria}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-[2px] size-[13px] rounded-full bg-bg transition-[left] duration-150 motion-reduce:transition-none',
          checked ? 'left-[15px]' : 'left-[2px]'
        )}
      />
    </button>
  )
}
