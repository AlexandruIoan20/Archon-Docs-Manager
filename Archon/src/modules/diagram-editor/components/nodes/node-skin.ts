import type { CSSProperties } from 'react'
import type { NodeStyle } from '@/core/types'
import { hexToRgba } from '@/shared/utils/color'

export interface NodeSkin {
  /** `ar-node--card` / `--outline` / `--solid` (+ `--pending`), styled in `nodes.css`. */
  className: string
  /** Per-node colors as CSS variables; the stylesheet does the rest. */
  style: CSSProperties
}

/**
 * The look of a node for a skin and color (plan 14 table), as a class and CSS
 * variables: `--node-color`, `--node-border`, `--node-tint` (icon background),
 * `--node-contour` (diamond outline).
 */
export function getNodeSkin(
  skin: NodeStyle,
  color: string,
  { pending = false }: { pending?: boolean } = {}
): NodeSkin {
  const vars: Record<string, string> = {
    '--node-color': color,
    '--node-contour': hexToRgba(color, 0.55)
  }
  if (skin === 'card') {
    vars['--node-border'] = hexToRgba(color, 0.45)
    vars['--node-tint'] = hexToRgba(color, 0.16)
  } else if (skin === 'outline') {
    vars['--node-border'] = color
    vars['--node-tint'] = 'transparent'
  } else {
    vars['--node-border'] = color
    vars['--node-tint'] = 'rgba(255, 255, 255, 0.22)'
  }
  return {
    className: ['ar-node', `ar-node--${skin}`, pending && 'ar-node--pending']
      .filter(Boolean)
      .join(' '),
    style: vars as CSSProperties
  }
}
