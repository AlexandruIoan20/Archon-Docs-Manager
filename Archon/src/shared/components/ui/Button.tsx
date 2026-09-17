import type { ComponentPropsWithRef } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline-accent' | 'danger-outline' | 'ghost'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconSize?: number
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent font-semibold text-on-accent hover:brightness-110',
  secondary: 'border border-border text-fg-muted hover:bg-surface-2 hover:text-fg',
  'outline-accent': 'border border-accent-border text-accent hover:bg-accent-soft',
  'danger-outline': 'border border-border text-danger hover:bg-danger/10',
  ghost: 'justify-start text-fg-muted hover:bg-surface-2 hover:text-fg'
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7',
  md: 'h-[30px]'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconSize = 14,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-[7px] whitespace-nowrap rounded-sm px-3 text-[12px] font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  )
}
