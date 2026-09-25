import { ReactFlowProvider } from '@xyflow/react'
import type { EditorSlotProps } from '@/core/types'
import { EmptyState } from '@/shared/components/ui'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { useConnectingStatus } from '../hooks/useConnectingStatus'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramShortcuts } from '../hooks/useDiagramShortcuts'
import { selectIsMermaid } from '../store/diagram.store'
import { DiagramStoreProvider } from '../store/DiagramStoreProvider'
import { useDiagramStoreFor } from '../store/store-registry'
import { CanvasOverlays } from './canvas/CanvasOverlays'
import { ToolCursor } from './canvas/ToolCursor'
import { DiagramCanvas } from './DiagramCanvas'
import { MermaidEditor } from './MermaidEditor'
import '../styles/react-flow.css'

/**
 * The `.soardiag` editor: the tab's store, then the canvas and its overlays,
 * or the Mermaid text editor for `engine: 'mermaid'`.
 */
export function DiagramEditor({ tab }: EditorSlotProps): React.JSX.Element {
  const { store, error } = useDiagram(tab)
  const mermaid = useDiagramStoreFor(tab.tabId, selectIsMermaid) ?? false
  const [sizeRef, { width, height }] = useElementSize<HTMLDivElement>()
  // Canvas shortcuts mean nothing in a text diagram.
  const canvasStore = mermaid ? null : store
  useDiagramShortcuts(canvasStore)
  useConnectingStatus(canvasStore)

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

  if (mermaid) {
    return (
      <DiagramStoreProvider store={store}>
        <MermaidEditor />
      </DiagramStoreProvider>
    )
  }

  return (
    <DiagramStoreProvider store={store}>
      <ReactFlowProvider>
        <ToolCursor>
          <div
            ref={sizeRef}
            data-testid="diagram-canvas"
            data-diagram-tab={tab.tabId}
            className="relative min-h-0 flex-1 bg-canvas"
          >
            <DiagramCanvas tabId={tab.tabId}>
              <CanvasOverlays width={width} height={height} />
            </DiagramCanvas>
          </div>
        </ToolCursor>
      </ReactFlowProvider>
    </DiagramStoreProvider>
  )
}
