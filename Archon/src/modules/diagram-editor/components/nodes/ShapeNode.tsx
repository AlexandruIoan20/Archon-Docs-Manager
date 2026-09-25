import { memo } from 'react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { cn } from '@/shared/utils/cn'
import { NODE_KINDS } from '../../constants/node-kinds'
import type { FlowNode } from '../../utils/graph-mapping'
import { NodeHandles } from './NodeHandles'
import { shapeStyle } from './shape-style'

/** Rectangle, ellipse or free text; resizable while selected. */
function ShapeNodeComponent({ type, data, selected }: NodeProps<FlowNode>): React.JSX.Element {
  const text = type === 'text'
  return (
    <>
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={text ? 40 : 32}
        minHeight={text ? 20 : 24}
        lineClassName="ar-resize-line"
        handleClassName="ar-resize-handle"
      />
      <div
        role="group"
        aria-label={`${NODE_KINDS[type].label} ${data.label}`.trim()}
        style={shapeStyle(data, text)}
        className={cn(
          'ar-shape',
          type === 'shape-ellipse' && 'ar-shape--ellipse',
          text && 'ar-shape--text'
        )}
      >
        {data.label && <span className="ar-shape-label">{data.label}</span>}
      </div>
      {!text && <NodeHandles />}
    </>
  )
}

export const ShapeNode = memo(ShapeNodeComponent)
