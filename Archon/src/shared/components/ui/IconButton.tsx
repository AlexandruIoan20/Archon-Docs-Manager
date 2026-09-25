import type { ComponentPropsWithRef } from 'react'
import { getShortcut, type ShortcutId } from '@/core/constants/shortcuts'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { ariaKeyShortcut, formatCombo, platformFromUserAgent } from '@/shared/utils/platform'
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
  /** A registry shortcut doing the same: shown in the tooltip, exposed as `aria-keyshortcuts`. */
  shortcut?: ShortcutId
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
  shortcut,
  type = 'button',
  className,
  ...props
}: IconButtonProps): React.JSX.Element {
  const platform = platformFromUserAgent()
  const combo = shortcut ? getShortcut(shortcut).keys[0] : undefined
  const button = (
    <button
      type={type}
      aria-label={label}
      aria-keyshortcuts={combo ? ariaKeyShortcut(platform, combo) : undefined}
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
    <Tooltip
      content={
        combo ? (
          <>
            {label} <span className="font-mono opacity-65">{formatCombo(platform, combo)}</span>
          </>
        ) : (
          label
        )
      }
      describe={false}
    >
      {button}
    </Tooltip>
  )
}
