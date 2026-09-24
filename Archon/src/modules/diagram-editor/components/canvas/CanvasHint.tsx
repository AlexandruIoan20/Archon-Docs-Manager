import { cn } from '@/shared/utils/cn'

export interface CanvasHintProps {
  /** The active tool's hint (plan 15); nothing is shown without one. */
  text?: string
  /** On narrow canvases the pill moves up, clear of the zoom controls. */
  raised?: boolean
}

export function CanvasHint({ text, raised = false }: CanvasHintProps): React.JSX.Element | null {
  if (!text) return null
  return (
    <div
      role="status"
      title={text}
      className={cn(
        'pointer-events-none absolute left-1/2 z-10 flex h-7 max-w-[calc(100%-32px)] -translate-x-1/2 items-center rounded-[14px] border border-accent-border bg-accent-soft px-3 text-[12px] text-accent-fg',
        raised ? 'bottom-14' : 'bottom-5'
      )}
    >
      <span className="truncate">{text}</span>
    </div>
  )
}
