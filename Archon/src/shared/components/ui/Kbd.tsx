import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export function Kbd({
  children,
  className
}: {
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return <kbd className={cn('font-mono text-[10px] opacity-65', className)}>{children}</kbd>
}
