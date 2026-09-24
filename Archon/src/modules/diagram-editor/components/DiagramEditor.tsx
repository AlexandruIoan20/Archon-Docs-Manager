import { ReactFlowProvider } from '@xyflow/react'
import type { EditorSlotProps } from '@/core/types'
import { EmptyState } from '@/shared/components/ui'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { useConnectingStatus } from '../hooks/useConnectingStatus'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramShortcuts } from '../hooks/useDiagramShortcuts'
import { DiagramStoreProvider } from '../store/DiagramStoreProvider'
import { CanvasOverlays } from './canvas/CanvasOverlays'
import { ToolCursor } from './canvas/ToolCursor'
import { DiagramCanvas } from './DiagramCanvas'
import '../styles/react-flow.css'

/** The `.soardiag` editor: the tab's store, the canvas and its overlays. */
export function DiagramEditor({ tab }: EditorSlotProps): React.JSX.Element {
  const { store, error } = useDiagram(tab)
  const [sizeRef, { width, height }] = useElementSize<HTMLDivElement>()
  useDiagramShortcuts(store)
  useConnectingStatus(store)

  if (!store) {
    return (
      <div
        role={error ? 'alert' : undefined}
        className="flex flex-1 items-center justify-center bg-canvas p-6"
      >
        <EmptyState>
          {error ? (
            <>
              <span className="text-fg">This diagram could not be opened.</span>
              <br />
              <span className="font-mono text-[11px] break-all">{error.message}</span>
            </>
          ) : (
            'Loading…'
          )}
        </EmptyState>
      </div>
    )
  }

  return (
    <DiagramStoreProvider store={store}>
      <ReactFlowProvider>
        <ToolCursor>
          <div
            ref={sizeRef}
            data-testid="diagram-canvas"
            className="relative min-h-0 flex-1 bg-canvas"
          >
            <DiagramCanvas>
              <CanvasOverlays width={width} height={height} />
            </DiagramCanvas>
          </div>
        </ToolCursor>
      </ReactFlowProvider>
    </DiagramStoreProvider>
  )
}
