import type { ComponentPropsWithRef } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { Tooltip } from './Tooltip'

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  icon: IconName
  /** Required: becomes the accessible name and the tooltip text. */
  label: string
  size?: IconButtonSize
  iconSize?: number
  variant?: 'ghost' | 'outline'
  active?: boolean
  tooltip?: boolean
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  xs: 'size-5 rounded-xs',
  sm: 'size-6 rounded-sm',
  md: 'size-7 rounded-sm',
  lg: 'size-[30px] rounded-sm'
}

const ICON_SIZES: Record<IconButtonSize, number> = { xs: 11, sm: 13, md: 15, lg: 16 }

export function IconButton({
  icon,
  label,
  size = 'lg',
  iconSize,
  variant = 'ghost',
  active = false,
  tooltip = true,
  type = 'button',
  className,
  ...props
}: IconButtonProps): React.JSX.Element {
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-pressed={active || undefined}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_CLASSES[size],
        variant === 'outline' && 'border border-border bg-surface-2',
        active
          ? 'bg-accent-soft text-accent shadow-[inset_0_0_0_1px_var(--accent-border)]'
          : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        className
      )}
      {...props}
    >
      <Icon name={icon} size={iconSize ?? ICON_SIZES[size]} />
    </button>
  )

  if (!tooltip) return button
  return (
    <Tooltip content={label} describe={false}>
      {button}
    </Tooltip>
  )
}
