import type { UmlDiagramType } from '@/core/types'
import { cn } from '@/shared/utils/cn'
import { SKETCHES, SKETCH_SIZE, type SketchShape } from '../../constants/diagram-sketches'
import '../../styles/new-diagram.css'

function Shape({ shape }: { shape: SketchShape }): React.JSX.Element {
  switch (shape.kind) {
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} />
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
    case 'ellipse':
      return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />
    case 'path':
      return <path d={shape.d} strokeDasharray={shape.dashed ? '3 2.5' : undefined} />
  }
}

/** The small drawing of a diagram type on its card: 160×54 on a dotted ground. */
export function DiagramSketch({
  type,
  selected
}: {
  type: UmlDiagramType
  selected: boolean
}): React.JSX.Element {
  const { width, height } = SKETCH_SIZE
  return (
    <div
      aria-hidden
      className={cn(
        'diagram-sketch mb-2 flex h-[54px] items-center justify-center overflow-hidden rounded-sm',
        selected ? 'text-accent' : 'text-fg-muted'
      )}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        {SKETCHES[type].map((shape, i) => (
          <Shape key={i} shape={shape} />
        ))}
      </svg>
    </div>
  )
}
