import { useReactFlow, useStore as useFlowStore } from '@xyflow/react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'
import { ZOOM_BAR_BUTTON, ZoomBar } from './ZoomBar'

export interface ZoomControlsProps {
  /** Set when the canvas is too small for the minimap: offers to show it anyway. */
  minimapToggle?: { shown: boolean; onToggle: () => void }
}

/** The canvas zoom at the bottom left; a zoom from here is saved with the viewport. */
export function ZoomControls({ minimapToggle }: ZoomControlsProps): React.JSX.Element {
  const { zoomTo, getViewport } = useReactFlow()
  const zoom = useFlowStore((state) => state.transform[2])
  const store = useDiagramStoreApi()

  const apply = (next: number): void => {
    void zoomTo(next).then(() => store.getState().setViewport(getViewport(), true))
  }

  return (
    <ZoomBar zoom={zoom} onZoom={apply}>
      {minimapToggle && (
        <button
          type="button"
          aria-label={minimapToggle.shown ? 'Hide minimap' : 'Show minimap'}
          aria-pressed={minimapToggle.shown}
          className={cn(ZOOM_BAR_BUTTON, minimapToggle.shown && 'text-accent')}
          onClick={minimapToggle.onToggle}
        >
          <Icon name="grid4" size={12} />
        </button>
      )}
    </ZoomBar>
  )
}
