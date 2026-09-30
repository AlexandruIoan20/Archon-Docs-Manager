import { useDiagramStore } from '../../store/DiagramStoreProvider'
import type { GuideLine } from '../../utils/smart-guides'

/** Half the length of the ticks closing a gap segment, in screen pixels. */
const TICK = 4

/** The ticks at both ends of a gap segment, across it. */
function ticks({ x1, y1, x2, y2 }: GuideLine, half: number): string {
  return y1 === y2
    ? `M${x1},${y1 - half}v${2 * half}M${x2},${y2 - half}v${2 * half}`
    : `M${x1 - half},${y1}h${2 * half}M${x2 - half},${y2}h${2 * half}`
}

/**
 * The smart guides of a drag: lines where edges and centres line up, and
 * bracketed segments where gaps repeat. Drawn in flow coordinates, inside
 * the viewport; strokes keep their screen width at any zoom.
 */
export function SmartGuides(): React.JSX.Element | null {
  const guides = useDiagramStore((s) => s.guides)
  const zoom = useDiagramStore((s) => s.viewport.zoom)
  if (!guides || (guides.align.length === 0 && guides.gaps.length === 0)) return null

  return (
    <svg aria-hidden className="ar-guides" width="1" height="1">
      {guides.align.map((line) => (
        <line key={`a${line.x1},${line.y1},${line.x2},${line.y2}`} className="ar-guide" {...line} />
      ))}
      {guides.gaps.map((line) => (
        <g key={`g${line.x1},${line.y1},${line.x2},${line.y2}`} className="ar-guide-gap">
          <line {...line} />
          <path d={ticks(line, TICK / zoom)} />
        </g>
      ))}
    </svg>
  )
}
