import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { NODE_KINDS, nodeColor, nodeIcon } from '../../constants/node-kinds'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import type { FlowNode } from '../../utils/graph-mapping'
import { useDiagramStyle } from '../diagram-style'
import { getNodeSkin } from './node-skin'
import { NodeHandles } from './NodeHandles'
import { NodeSelectionChrome } from './NodeSelectionChrome'

/**
 * The common node: skin, icon, title and subtitle, handles, selection chrome.
 * Rectangles are 176×64; `decision` is the 100×100 diamond. Colors reach the
 * stylesheet as CSS variables (`getNodeSkin`), not as repeated inline styles.
 */
function BaseNodeComponent({ id, type, data, selected }: NodeProps<FlowNode>): React.JSX.Element {
  const { nodeStyle, connecting } = useDiagramStyle()
  const kind = NODE_KINDS[type] ?? NODE_KINDS.element
  const pending = useDiagramStore((s) => s.connectFrom === id)
  const skin = getNodeSkin(nodeStyle, nodeColor(type, data.color), { pending })
  const icon = nodeIcon(type, data.icon)
  const diamond = kind.shape === 'diamond'

  return (
    <div
      role="group"
      aria-label={`${kind.label} ${data.label}`.trim()}
      data-shape={kind.shape}
      style={skin.style}
      className={cn(
        skin.className,
        diamond && 'soar-node--diamond',
        connecting && 'soar-node--connecting'
      )}
    >
      {diamond && (
        // An SVG polygon: a clip-path would cut the border away from the diagonal edges.
        <svg aria-hidden className="soar-diamond" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,1 99,50 50,99 1,50" />
        </svg>
      )}
      <div className="soar-node-body">
        <span className="soar-node-icon">
          <Icon name={icon} size={diamond ? 13 : 15} />
        </span>
        <span className="soar-node-text">
          <span className="soar-node-title">{data.label || kind.label}</span>
          {data.subtitle && <span className="soar-node-subtitle">{data.subtitle}</span>}
        </span>
      </div>
      <NodeHandles />
      {selected && <NodeSelectionChrome id={id} />}
    </div>
  )
}

export const BaseNode = memo(BaseNodeComponent)
