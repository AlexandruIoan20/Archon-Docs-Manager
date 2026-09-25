import type { ReactNode } from 'react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { MAX_ZOOM, MIN_ZOOM, stepZoom } from '../../utils/zoom'

export interface ZoomBarProps {
  zoom: number
  onZoom: (zoom: number) => void
  /** Extra buttons after „+” (the minimap toggle). */
  children?: ReactNode
  className?: string
}

export const ZOOM_BAR_BUTTON =
  'inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40'

/** − / percentage / +, 30%–200% in 10% steps: the canvas and the Mermaid preview. */
export function ZoomBar({ zoom, onZoom, children, className }: ZoomBarProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'absolute bottom-4 left-4 z-10 flex h-7 items-center gap-0.5 rounded-md border border-border bg-surface p-0.5',
        className
      )}
    >
      <button
        type="button"
        aria-label="Zoom out"
        className={ZOOM_BAR_BUTTON}
        disabled={zoom <= MIN_ZOOM + 1e-6}
        onClick={() => onZoom(stepZoom(zoom, -1))}
      >
        <Icon name="winMinimize" size={13} />
      </button>
      <button
        type="button"
        aria-label="Reset zoom to 100%"
        title="Reset zoom to 100%"
        className="h-6 w-11 cursor-pointer rounded-sm font-mono text-[11px] text-fg-muted hover:bg-surface-2 hover:text-fg"
        onClick={() => onZoom(1)}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        className={ZOOM_BAR_BUTTON}
        disabled={zoom >= MAX_ZOOM - 1e-6}
        onClick={() => onZoom(stepZoom(zoom, 1))}
      >
        <Icon name="plus" size={13} />
      </button>
      {children}
    </div>
  )
}
