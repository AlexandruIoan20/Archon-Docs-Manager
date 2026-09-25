import { useMemo, useState, type ReactNode } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ViewportPortal,
  type OnMove,
  type OnSelectionChangeParams
} from '@xyflow/react'
import { useDiagramStore, useDiagramStoreApi } from '../store/DiagramStoreProvider'
import { isDefaultViewport, type FlowEdge, type FlowNode } from '../utils/graph-mapping'
import '../styles/nodes.css'
import '../styles/node-chrome.css'
import '../styles/edges.css'
import '../styles/tools.css'
import { MAX_ZOOM, MIN_ZOOM } from '../utils/zoom'
import { useCanvasInteractions } from '../hooks/useCanvasInteractions'
import { useCanvasContextMenu } from '../hooks/useCanvasContextMenu'
import { useFocusRequest } from '../hooks/useFocusRequest'
import { useNodeTypes } from '../hooks/useNodeTypes'
import { DiagramStyleContext, type DiagramStyle } from './diagram-style'
import { EdgeMarkers } from './edges/EdgeMarkers'

const FIT_VIEW_OPTIONS = { padding: 0.12 }

/** The React Flow canvas, controlled by the tab's diagram store. */
export function DiagramCanvas({
  tabId,
  children
}: {
  tabId: string
  children?: ReactNode
}): React.JSX.Element {
  const store = useDiagramStoreApi()
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const onNodesChange = useDiagramStore((s) => s.onNodesChange)
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange)
  // Read once: afterwards React Flow owns the viewport and reports it back.
  const [initialViewport] = useState(() => store.getState().viewport)
  const fitOnOpen = isDefaultViewport(initialViewport)
  const { nodeTypes, edgeTypes, nodeStyle, edgeStyle } = useNodeTypes()
  const connecting = useDiagramStore((s) => s.tool === 'connect')
  const interactions = useCanvasInteractions()
  const contextMenu = useCanvasContextMenu()
  useFocusRequest(tabId)
  const style = useMemo<DiagramStyle>(
    () => ({ nodeStyle, edgeStyle, connecting }),
    [nodeStyle, edgeStyle, connecting]
  )

  // Live, for the status bar zoom; not an edit.
  const onMove: OnMove = (_event, viewport) => store.getState().setViewport(viewport, false)
  // A pan or zoom by the user is saved. Programmatic moves (the first fit) are
  // not; the zoom controls save their own.
  const onMoveEnd: OnMove = (event, viewport) =>
    store.getState().setViewport(viewport, event !== null)
  const onSelectionChange = ({ nodes: n, edges: e }: OnSelectionChangeParams): void =>
    store.getState().setSelection({ nodes: n.map((x) => x.id), edges: e.map((x) => x.id) })

  return (
    <DiagramStyleContext value={style}>
      <ReactFlow<FlowNode, FlowEdge>
        className="ar-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onMove={onMove}
        onMoveEnd={onMoveEnd}
        defaultViewport={initialViewport}
        fitView={fitOnOpen}
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        // Deleting is ours (undo + toast), see `useDiagramShortcuts`.
        deleteKeyCode={null}
        {...interactions}
        onPaneContextMenu={contextMenu.onPaneContextMenu}
        onNodeContextMenu={contextMenu.onNodeContextMenu}
        attributionPosition="top-right"
      >
        {/* Inside the viewport, so an exported image keeps its arrowheads. */}
        <ViewportPortal>
          <EdgeMarkers />
        </ViewportPortal>
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} />
        {children}
      </ReactFlow>
      {contextMenu.element}
    </DiagramStyleContext>
  )
}
