import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'
import { cn } from '@/shared/utils/cn'
import { useIsHotEdge } from '../../hooks/useHotEdges'
import { useDiagramStyle } from '../diagram-style'
import { getSoarEdgePath } from './edge-path'
import { ARROW_MARKER_ID, HOT_ARROW_MARKER_ID } from './EdgeMarkers'

/**
 * The SOAR edge: text3 with an arrow; accent and animated ("hot") when it
 * touches a selected node; an optional mono label above its middle.
 */
function SoarEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  selected,
  data
}: EdgeProps): React.JSX.Element {
  const { edgeStyle } = useDiagramStyle()
  const hot = useIsHotEdge(source, target) || Boolean(selected)
  const { d, labelX, labelY } = getSoarEdgePath(edgeStyle, { sourceX, sourceY, targetX, targetY })

  return (
    <>
      <BaseEdge
        id={id}
        path={d}
        className={cn('soar-edge', hot && 'soar-edge--hot')}
        markerEnd={`url(#${hot ? HOT_ARROW_MARKER_ID : ARROW_MARKER_ID})`}
        interactionWidth={16}
        // A style picked in the toolbar; a hot edge shows the accent instead.
        style={
          hot
            ? undefined
            : {
                stroke: typeof data?.stroke === 'string' ? data.stroke : undefined,
                strokeWidth: typeof data?.strokeWidth === 'number' ? data.strokeWidth : undefined
              }
        }
      />
      {typeof label === 'string' && label !== '' && (
        <EdgeLabelRenderer>
          <div
            className="soar-edge-label nopan"
            style={{ transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 4}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const SoarEdge = memo(SoarEdgeComponent)
