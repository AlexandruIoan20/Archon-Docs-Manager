import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/shared/utils/cn'

export type FieldTone = 'default' | 'muted'

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  tone?: FieldTone
}

const TONE_CLASSES: Record<FieldTone, string> = {
  default: 'text-[13px] text-fg',
  muted: 'text-[12px] text-fg-muted'
}

export function Input({ tone = 'default', className, ...props }: InputProps): React.JSX.Element {
  return (
    <input
      className={cn(
        'h-[30px] w-full min-w-0 rounded-sm border border-border bg-bg px-[9px] placeholder:text-fg-subtle focus:border-accent-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
}
