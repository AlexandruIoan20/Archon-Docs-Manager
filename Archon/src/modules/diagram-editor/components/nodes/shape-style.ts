import type { CSSProperties } from 'react'
import { hexToRgba } from '@/shared/utils/color'
import { NODE_COLORS } from '../../constants/node-palette'
import type { FlowNode } from '../../utils/graph-mapping'

/** Stroke, fill (at 16%), weight and font size of a shape or text node. */
export function shapeStyle(data: FlowNode['data'], text: boolean): CSSProperties {
  return {
    '--shape-stroke': data.stroke ?? (text ? 'var(--text)' : NODE_COLORS.neutral),
    '--shape-fill': data.fill ? hexToRgba(data.fill, 0.16) : 'transparent',
    '--shape-stroke-width': `${data.strokeWidth ?? 1.5}px`,
    fontSize: data.fontSize ?? 13
  } as CSSProperties
}
