import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/shared/utils/cn'
import type { FieldTone } from './Input'

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  tone?: FieldTone
}

export function Textarea({
  tone = 'default',
  className,
  ...props
}: TextareaProps): React.JSX.Element {
  return (
    <textarea
      className={cn(
        'w-full min-w-0 resize-none rounded-sm border border-border bg-bg px-[9px] py-2 text-[12px] leading-[1.5] placeholder:text-fg-subtle focus:border-accent-border',
        'disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'muted' ? 'text-fg-muted' : 'text-fg',
        className
      )}
      {...props}
    />
  )
}
