import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

export type StatusDot = 'success' | 'accent' | 'danger'

/**
 * Which segments give way first on a narrow status bar
 * (rules in `globals.css`, on the `statusbar` container):
 * `3` hides below 720px, `2` below 560px, `1` below 420px.
 * Segments without a priority always stay.
 */
export type StatusPriority = 1 | 2 | 3

export interface StatusSegmentProps {
  children: ReactNode
  dot?: StatusDot
  mono?: boolean
  priority?: StatusPriority
  /** Takes the remaining space and may shrink to nothing (the file path). */
  grow?: boolean
  title?: string
  className?: string
}

const DOT_CLASSES: Record<StatusDot, string> = {
  success: 'bg-success',
  accent: 'bg-accent',
  danger: 'bg-danger'
}

export function StatusSegment({
  children,
  dot,
  mono = false,
  priority,
  grow = false,
  title,
  className
}: StatusSegmentProps): React.JSX.Element {
  return (
    <span
      data-priority={priority}
      title={title}
      className={cn(
        'flex items-center gap-1.5 whitespace-nowrap',
        grow ? 'min-w-0 flex-auto overflow-hidden' : 'shrink-0',
        mono && 'font-mono',
        className
      )}
    >
      {dot && (
        <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASSES[dot])} />
      )}
      {children}
    </span>
  )
}
