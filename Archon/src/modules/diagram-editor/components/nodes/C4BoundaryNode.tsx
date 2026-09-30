import { memo } from 'react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { NODE_KINDS, nodeColor } from '../../constants/node-kinds'
import type { FlowNode } from '../../utils/graph-mapping'
import { c4TypeLine } from './c4-labels'

/**
 * A C4 boundary: a dashed frame around the elements of a system or container,
 * named at its bottom left. It lies under the other nodes and only its label
 * takes the pointer, so what it frames stays clickable. Resizable when selected.
 */
function C4BoundaryNodeComponent({ type, data, selected }: NodeProps<FlowNode>): React.JSX.Element {
  return (
    <>
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={160}
        minHeight={100}
        lineClassName="ar-resize-line"
        handleClassName="ar-resize-handle"
      />
      <div
        role="group"
        aria-label={`${NODE_KINDS[type].label} ${data.label}`.trim()}
        className="ar-c4-boundary"
        style={{ '--node-color': nodeColor(type, data.color) } as React.CSSProperties}
      >
        <span className="ar-c4-boundary-label">
          <span className="ar-c4-name">{data.label || NODE_KINDS[type].label}</span>
          <span className="ar-c4-type">{c4TypeLine(type, data)}</span>
        </span>
      </div>
    </>
  )
}

export const C4BoundaryNode = memo(C4BoundaryNodeComponent)
