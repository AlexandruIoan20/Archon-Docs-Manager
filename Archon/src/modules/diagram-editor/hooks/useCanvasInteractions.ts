import type { MouseEvent as ReactMouseEvent } from 'react'
import { useReactFlow, type Connection, type ReactFlowProps } from '@xyflow/react'
import { useUiStore } from '@/store'
import { placedNodeType } from '../constants/tools'
import { useDiagramStore, useDiagramStoreApi } from '../store/DiagramStoreProvider'
import type { FlowEdge, FlowNode } from '../utils/graph-mapping'

type CanvasProps = Pick<
  ReactFlowProps<FlowNode, FlowEdge>,
  | 'onPaneClick'
  | 'onNodeClick'
  | 'onConnect'
  | 'panOnDrag'
  | 'selectionOnDrag'
  | 'nodesDraggable'
  | 'elementsSelectable'
>

// The middle button always pans; the Pan tool adds the left one. The right
// button is the context menu (React Flow drops it when right-drag pans).
const PAN_BUTTONS = [1]

/**
 * What the canvas does with clicks and drags under the active tool: place a
 * node, connect two nodes in two clicks, pan, or select (React Flow's own).
 */
export function useCanvasInteractions(): CanvasProps {
  const store = useDiagramStoreApi()
  const tool = useDiagramStore((s) => s.tool)
  const { screenToFlowPosition } = useReactFlow()
  const notify = (message: string): void => useUiStore.getState().notify(message)

  const onPaneClick = (event: ReactMouseEvent): void => {
    const state = store.getState()
    const type = placedNodeType(state.tool, state.nodeKind)
    if (type) {
      state.addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
      state.setTool('select')
      notify(type.startsWith('shape') || type === 'text' ? 'Shape added' : 'Node added')
    } else if (state.connectFrom) {
      state.setConnectFrom(null)
    }
  }

  const onNodeClick = (_event: ReactMouseEvent, node: FlowNode): void => {
    const state = store.getState()
    if (state.tool !== 'connect') return
    if (!state.connectFrom) {
      state.setConnectFrom(node.id)
    } else if (state.connectFrom === node.id) {
      state.setConnectFrom(null)
    } else {
      const edge = state.connect(state.connectFrom, node.id)
      state.setTool('select')
      notify(edge ? 'Edge created' : 'These nodes are already connected')
    }
  }

  // Dragging from a handle, in the Select tool.
  const onConnect = ({ source, target }: Connection): void => {
    if (store.getState().connect(source, target)) notify('Edge created')
  }

  return {
    onPaneClick,
    onNodeClick,
    onConnect,
    panOnDrag: tool === 'pan' ? true : PAN_BUTTONS,
    selectionOnDrag: tool === 'select',
    nodesDraggable: tool === 'select',
    elementsSelectable: tool !== 'pan'
  }
}
