import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export interface SectionLabelProps {
  children: ReactNode
  /** When set, renders a `<label>` bound to that field. */
  htmlFor?: string
  id?: string
  className?: string
}

const LABEL_CLASSES = 'mb-1.5 block text-[11px] font-medium tracking-[.3px] text-fg-muted uppercase'

export function SectionLabel({
  children,
  htmlFor,
  id,
  className
}: SectionLabelProps): React.JSX.Element {
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} id={id} className={cn(LABEL_CLASSES, className)}>
        {children}
      </label>
    )
  }
  return (
    <div id={id} className={cn(LABEL_CLASSES, className)}>
      {children}
    </div>
  )
}
