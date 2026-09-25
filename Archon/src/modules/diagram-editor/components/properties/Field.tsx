import type { ReactNode } from 'react'
import { SectionLabel } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'

export interface FieldProps {
  label: string
  /** The id of the control, bound to the label. Omit for a group (swatches). */
  htmlFor?: string
  /** The label's id, for groups named with `aria-labelledby`. */
  labelId?: string
  children: ReactNode
  className?: string
}

/** A labelled row of the panel: NAME, COLOR… */
export function Field({
  label,
  htmlFor,
  labelId,
  children,
  className
}: FieldProps): React.JSX.Element {
  return (
    <div className={cn('min-w-0', className)}>
      <SectionLabel htmlFor={htmlFor} id={labelId}>
        {label}
      </SectionLabel>
      {children}
    </div>
  )
}
