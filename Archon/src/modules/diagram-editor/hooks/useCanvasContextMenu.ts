import type { MouseEvent as ReactMouseEvent } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useUiStore } from '@/store'
import { useContextMenu, type ContextMenuControls } from '@/shared/components/ui'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { copyText } from '@/shared/utils/copy-text'
import { shortcutLabel } from '@/shared/utils/platform'
import { useDiagramStoreApi } from '../store/DiagramStoreProvider'
import { canvasMenuItems, nodeMenuItems } from '../utils/canvas-menu-items'
import type { FlowNode } from '../utils/graph-mapping'
import { useDeleteSelection } from './useDeleteSelection'
import { useNodeClipboard } from './useNodeClipboard'

export interface CanvasContextMenu {
  onPaneContextMenu: (event: ReactMouseEvent | MouseEvent) => void
  onNodeContextMenu: (event: ReactMouseEvent, node: FlowNode) => void
  element: ContextMenuControls['element']
}

/** Right click on the canvas (add here, paste, fit, zoom) and on nodes (copy, type, delete). */
export function useCanvasContextMenu(): CanvasContextMenu {
  const store = useDiagramStoreApi()
  const { screenToFlowPosition, fitView, zoomTo, getViewport } = useReactFlow()
  const menu = useContextMenu()
  const platform = usePlatform()
  const clipboard = useNodeClipboard(store)
  const remove = useDeleteSelection(store)
  const keys = (id: Parameters<typeof shortcutLabel>[1]): string => shortcutLabel(platform, id)

  const onPaneContextMenu = (event: ReactMouseEvent | MouseEvent): void => {
    const at = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    menu.open(
      event,
      canvasMenuItems({
        addNode: (type) => {
          store.getState().addNode(type, at)
          useUiStore.getState().notify('Node added')
        },
        paste: () => void clipboard.paste(at),
        fitView: () => void fitView({ padding: 0.12, duration: 200 }),
        resetZoom: () => {
          void zoomTo(1).then(() => store.getState().setViewport(getViewport(), true))
        },
        keys
      }),
      'Canvas'
    )
  }

  const onNodeContextMenu = (event: ReactMouseEvent, node: FlowNode): void => {
    // The menu acts on the selection: a node outside it becomes the selection.
    if (!node.selected) store.getState().selectNodes([node.id])
    menu.open(
      event,
      nodeMenuItems(node, {
        duplicate: clipboard.duplicate,
        copy: () => void clipboard.copy(),
        copyId: (id) => void copyText(id, 'Node id copied'),
        changeType: (id, type) => store.getState().changeNodeType(id, type),
        remove,
        keys
      }),
      `Node ${node.id}`
    )
  }

  return { onPaneContextMenu, onNodeContextMenu, element: menu.element }
}
