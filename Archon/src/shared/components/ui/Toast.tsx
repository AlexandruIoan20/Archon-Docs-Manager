import { cn } from '@/shared/utils/cn'

export type ToastVariant = 'info' | 'error'

export interface ToastProps {
  message: string
  tone?: ToastVariant
  className?: string
}

/** A one-line confirmation pill (two lines for errors), full text in `title`. */
export function Toast({ message, tone = 'info', className }: ToastProps): React.JSX.Element {
  const error = tone === 'error'
  return (
    <div
      role={error ? 'alert' : 'status'}
      title={message}
      data-tone={tone}
      className={cn(
        'pointer-events-auto flex max-w-[min(560px,calc(100vw-32px))] items-center gap-2.5 rounded-md border bg-surface px-3.5 text-[12px] text-fg shadow-toast',
        error ? 'min-h-8 border-danger py-1.5' : 'h-8 border-accent-border',
        className
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 shrink-0 rounded-full', error ? 'bg-danger' : 'bg-accent')}
      />
      <span className={cn('min-w-0', error ? 'line-clamp-2' : 'truncate')}>{message}</span>
    </div>
  )
}
