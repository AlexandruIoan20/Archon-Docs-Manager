import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export function EmptyState({
  children,
  className
}: {
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('text-center text-[12px] leading-[1.6] text-fg-subtle', className)}>
      {children}
    </div>
  )
}
