import { useReactFlow, useStore as useFlowStore } from '@xyflow/react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'
import { MAX_ZOOM, MIN_ZOOM, stepZoom } from '../../utils/zoom'

export interface ZoomControlsProps {
  /** Set when the canvas is too small for the minimap: offers to show it anyway. */
  minimapToggle?: { shown: boolean; onToggle: () => void }
}

const BUTTON =
  'inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40'

/** − / percentage / + at the bottom left of the canvas (30%–200%, 10% steps). */
export function ZoomControls({ minimapToggle }: ZoomControlsProps): React.JSX.Element {
  const { zoomTo, getViewport } = useReactFlow()
  const zoom = useFlowStore((state) => state.transform[2])
  const store = useDiagramStoreApi()

  const apply = (next: number): void => {
    void zoomTo(next).then(() => store.getState().setViewport(getViewport(), true))
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 flex h-7 items-center gap-0.5 rounded-md border border-border bg-surface p-0.5">
      <button
        type="button"
        aria-label="Zoom out"
        className={BUTTON}
        disabled={zoom <= MIN_ZOOM + 1e-6}
        onClick={() => apply(stepZoom(zoom, -1))}
      >
        <Icon name="winMinimize" size={13} />
      </button>
      <button
        type="button"
        aria-label="Reset zoom to 100%"
        title="Reset zoom to 100%"
        className="h-6 w-11 cursor-pointer rounded-sm font-mono text-[11px] text-fg-muted hover:bg-surface-2 hover:text-fg"
        onClick={() => apply(1)}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        className={BUTTON}
        disabled={zoom >= MAX_ZOOM - 1e-6}
        onClick={() => apply(stepZoom(zoom, 1))}
      >
        <Icon name="plus" size={13} />
      </button>
      {minimapToggle && (
        <button
          type="button"
          aria-label={minimapToggle.shown ? 'Hide minimap' : 'Show minimap'}
          aria-pressed={minimapToggle.shown}
          className={cn(BUTTON, minimapToggle.shown && 'text-accent')}
          onClick={minimapToggle.onToggle}
        >
          <Icon name="grid4" size={12} />
        </button>
      )}
    </div>
  )
}
