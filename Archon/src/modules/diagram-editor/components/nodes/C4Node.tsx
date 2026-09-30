import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { cn } from '@/shared/utils/cn'
import { NODE_KINDS, nodeColor } from '../../constants/node-kinds'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import type { FlowNode } from '../../utils/graph-mapping'
import { useDiagramStyle } from '../diagram-style'
import { c4TypeLine } from './c4-labels'
import { getNodeSkin } from './node-skin'
import { NodeHandles } from './NodeHandles'
import { NodeSelectionChrome } from './NodeSelectionChrome'

/**
 * A C4 element: name, bracketed type line and description, centred. People
 * get a head above the box, databases a cylinder; colors follow the skin.
 */
function C4NodeComponent({ id, type, data, selected }: NodeProps<FlowNode>): React.JSX.Element {
  const { nodeStyle, connecting } = useDiagramStyle()
  const kind = NODE_KINDS[type]
  const pending = useDiagramStore((s) => s.connectFrom === id)
  const skin = getNodeSkin(nodeStyle, nodeColor(type, data.color, data.external), { pending })

  return (
    <div
      role="group"
      aria-label={`${kind.label} ${data.label}`.trim()}
      data-shape={kind.shape}
      style={skin.style}
      className={cn(
        skin.className,
        'ar-c4',
        `ar-c4--${kind.shape}`,
        connecting && 'ar-node--connecting'
      )}
    >
      {kind.shape === 'cylinder' && (
        // Stretched to the node; the stroke keeps its width (`vector-effect`).
        <svg
          aria-hidden
          className="ar-c4-cylinder"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path className="ar-c4-cylinder-body" d="M1 9a49 8 0 0 1 98 0v82a49 8 0 0 1-98 0z" />
          <path className="ar-c4-cylinder-rim" d="M1 9a49 8 0 0 0 98 0" />
        </svg>
      )}
      <div className="ar-node-body ar-c4-body">
        <span className="ar-c4-name">{data.label || kind.label}</span>
        <span className="ar-c4-type">{c4TypeLine(type, data)}</span>
        {data.description && <span className="ar-c4-description">{data.description}</span>}
      </div>
      {kind.shape === 'person' && <span aria-hidden className="ar-c4-head" />}
      <NodeHandles />
      {selected && <NodeSelectionChrome id={id} />}
    </div>
  )
}

export const C4Node = memo(C4NodeComponent)
