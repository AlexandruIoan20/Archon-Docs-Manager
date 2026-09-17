export type FloatingSide = 'top' | 'bottom'
export type FloatingAlign = 'start' | 'center' | 'end'
export type FloatingPlacement = FloatingSide | `${FloatingSide}-${Exclude<FloatingAlign, 'center'>}`

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface FloatingPositionInput {
  anchor: Rect
  /** Natural (unclamped) size of the floating element. */
  floating: Size
  viewport: Size
  placement: FloatingPlacement
  /** Gap between anchor and floating element. */
  offset?: number
  /** Minimum distance kept from the viewport edges. */
  margin?: number
}

export interface FloatingPosition {
  x: number
  y: number
  side: FloatingSide
  /** Height available on the chosen side; the element scrolls beyond it. */
  maxHeight: number
}

function parsePlacement(placement: FloatingPlacement): [FloatingSide, FloatingAlign] {
  const [side, align] = placement.split('-') as [FloatingSide, FloatingAlign | undefined]
  return [side, align ?? 'center']
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Places a floating element next to its anchor without leaving the viewport:
 * flips to the opposite side when the preferred one is too short, and shifts
 * horizontally to stay inside the margins.
 */
export function computeFloatingPosition({
  anchor,
  floating,
  viewport,
  placement,
  offset = 4,
  margin = 8
}: FloatingPositionInput): FloatingPosition {
  const [preferred, align] = parsePlacement(placement)
  const anchorBottom = anchor.y + anchor.height

  const space: Record<FloatingSide, number> = {
    bottom: Math.max(viewport.height - anchorBottom - offset - margin, 0),
    top: Math.max(anchor.y - offset - margin, 0)
  }
  const opposite: FloatingSide = preferred === 'bottom' ? 'top' : 'bottom'
  const side =
    floating.height > space[preferred] && space[opposite] > space[preferred] ? opposite : preferred

  const maxHeight = space[side]
  const height = Math.min(floating.height, maxHeight)
  const y = side === 'bottom' ? anchorBottom + offset : anchor.y - offset - height

  const alignedX =
    align === 'start'
      ? anchor.x
      : align === 'end'
        ? anchor.x + anchor.width - floating.width
        : anchor.x + anchor.width / 2 - floating.width / 2
  const maxX = viewport.width - margin - floating.width
  const x = maxX < margin ? margin : clamp(alignedX, margin, maxX)

  return { x, y, side, maxHeight }
}
