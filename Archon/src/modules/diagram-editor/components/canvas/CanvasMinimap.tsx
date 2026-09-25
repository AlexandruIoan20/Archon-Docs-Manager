import { MiniMap } from '@xyflow/react'
import { nodeColor } from '../../constants/node-kinds'
import type { FlowNode } from '../../utils/graph-mapping'

// Node colors are data (the semantic palette): the node's own, or its kind's.
const minimapColor = (node: FlowNode): string => nodeColor(node.type, node.data.color)
const nodeStroke = (node: FlowNode): string => (node.selected ? 'var(--accent)' : 'transparent')

/** 120×80 overview at the bottom right; pannable and zoomable. */
export function CanvasMinimap(): React.JSX.Element {
  return (
    <MiniMap<FlowNode>
      position="bottom-right"
      ariaLabel="Diagram overview"
      className="ar-minimap"
      style={{ width: 120, height: 80 }}
      nodeColor={minimapColor}
      nodeStrokeColor={nodeStroke}
      nodeStrokeWidth={1.5}
      nodeBorderRadius={2}
      pannable
      zoomable
    />
  )
}
