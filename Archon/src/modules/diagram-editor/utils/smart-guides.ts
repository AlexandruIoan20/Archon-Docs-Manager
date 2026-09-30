import type { Rect } from './node-rect'

type Axis = 'x' | 'y'

/** A segment on the canvas, in flow coordinates. */
export interface GuideLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Guides {
  /** Edges or centres that line up with another node's. */
  align: GuideLine[]
  /** Equal gaps between neighbours, one segment per gap. */
  gaps: GuideLine[]
}

export interface SnapResult {
  dx: number
  dy: number
  guides: Guides
}

interface Span {
  start: number
  end: number
}

/** Below this, two values are the same line (sub-pixel noise from measuring). */
const SAME = 0.5

const cross = (axis: Axis): Axis => (axis === 'x' ? 'y' : 'x')

const along = (r: Rect, axis: Axis): Span =>
  axis === 'x' ? { start: r.x, end: r.x + r.width } : { start: r.y, end: r.y + r.height }

const anchors = ({ start, end }: Span): number[] => [start, (start + end) / 2, end]

const overlaps = (a: Span, b: Span): boolean => a.start < b.end && b.start < a.end

const shift = (r: Rect, axis: Axis, d: number): Rect =>
  axis === 'x' ? { ...r, x: r.x + d } : { ...r, y: r.y + d }

/** The middle of where two boxes overlap across `axis`: where a gap between them is drawn. */
const middleAcross = (a: Rect, b: Rect, axis: Axis): number => {
  const sa = along(a, cross(axis))
  const sb = along(b, cross(axis))
  return (Math.max(sa.start, sb.start) + Math.min(sa.end, sb.end)) / 2
}

/** A segment from `from` to `to` along `axis`, at `at` across it. */
const segment = (axis: Axis, from: number, to: number, at: number): GuideLine =>
  axis === 'x' ? { x1: from, y1: at, x2: to, y2: at } : { x1: at, y1: from, x2: at, y2: to }

/** The boxes in `moving`'s row (`axis` x) or column (`axis` y), sorted along `axis`. */
function lane(moving: Rect, others: readonly Rect[], axis: Axis): Rect[] {
  const band = along(moving, cross(axis))
  return others
    .filter((o) => overlaps(along(o, cross(axis)), band))
    .sort((a, b) => along(a, axis).start - along(b, axis).start)
}

/** Gaps between consecutive boxes of a lane, with where each one is drawn. */
function laneGaps(boxes: readonly Rect[], axis: Axis): { length: number; line: GuideLine }[] {
  const gaps: { length: number; line: GuideLine }[] = []
  for (let i = 1; i < boxes.length; i++) {
    const a = boxes[i - 1]!
    const b = boxes[i]!
    const from = along(a, axis).end
    const to = along(b, axis).start
    if (to - from > SAME) {
      gaps.push({ length: to - from, line: segment(axis, from, to, middleAcross(a, b, axis)) })
    }
  }
  return gaps
}

/** The nearest box before and after `moving` in its lane. */
function neighbours(
  moving: Rect,
  boxes: readonly Rect[],
  axis: Axis,
  slack: number
): { before?: Rect; after?: Rect } {
  const m = along(moving, axis)
  let before: Rect | undefined
  let after: Rect | undefined
  for (const box of boxes) {
    const s = along(box, axis)
    if (s.end <= m.start + slack && (!before || s.end > along(before, axis).end)) before = box
    if (s.start >= m.end - slack && (!after || s.start < along(after, axis).start)) after = box
  }
  return { before, after }
}

/**
 * How far to move `moving` along `axis` to line an edge or centre up with
 * another box, or to repeat a gap of its lane; 0 when nothing is within
 * `threshold`. On a tie, lining up wins.
 */
function snapOffset(moving: Rect, others: readonly Rect[], axis: Axis, threshold: number): number {
  let best = 0
  let bestDistance = threshold + Number.EPSILON
  const consider = (d: number): void => {
    if (Math.abs(d) < bestDistance) {
      best = d
      bestDistance = Math.abs(d)
    }
  }

  const m = along(moving, axis)
  for (const other of others) {
    for (const target of anchors(along(other, axis))) {
      for (const own of anchors(m)) consider(target - own)
    }
  }

  const boxes = lane(moving, others, axis)
  const gaps = laneGaps(boxes, axis).map((gap) => gap.length)
  const { before, after } = neighbours(moving, boxes, axis, threshold)
  const size = m.end - m.start
  for (const gap of gaps) {
    if (before) consider(along(before, axis).end + gap - m.start)
    if (after) consider(along(after, axis).start - gap - m.end)
  }
  if (before && after) {
    const room = along(after, axis).start - along(before, axis).end
    if (room > size) consider(along(before, axis).end + (room - size) / 2 - m.start)
  }
  return best
}

/** Lines through the edges and centres `moving` shares with other boxes. */
function alignLines(moving: Rect, others: readonly Rect[], axis: Axis): GuideLine[] {
  // A line at a value along `axis`, spanning every box on it across the axis.
  const lines = new Map<number, Span>()
  const own = anchors(along(moving, axis))
  for (const other of others) {
    for (const target of anchors(along(other, axis))) {
      const value = own.find((v) => Math.abs(v - target) < SAME)
      if (value === undefined) continue
      const extent = lines.get(value) ?? along(moving, cross(axis))
      const o = along(other, cross(axis))
      lines.set(value, { start: Math.min(extent.start, o.start), end: Math.max(extent.end, o.end) })
    }
  }
  return [...lines].map(([value, { start, end }]) => segment(cross(axis), start, end, value))
}

/** The gaps next to `moving` that repeat one elsewhere in its lane, with their matches. */
function equalGaps(moving: Rect, others: readonly Rect[], axis: Axis): GuideLine[] {
  const boxes = lane(moving, others, axis)
  const { before, after } = neighbours(moving, boxes, axis, SAME)
  const mine: { length: number; line: GuideLine }[] = []
  const m = along(moving, axis)
  if (before) {
    const from = along(before, axis).end
    if (m.start - from > SAME) {
      mine.push({
        length: m.start - from,
        line: segment(axis, from, m.start, middleAcross(before, moving, axis))
      })
    }
  }
  if (after) {
    const to = along(after, axis).start
    if (to - m.end > SAME) {
      mine.push({
        length: to - m.end,
        line: segment(axis, m.end, to, middleAcross(moving, after, axis))
      })
    }
  }
  const candidates = [...mine, ...laneGaps(boxes, axis)]
  const shown = new Set<GuideLine>()
  for (const gap of mine) {
    const matches = candidates.filter(
      (other) => other !== gap && Math.abs(other.length - gap.length) < SAME
    )
    if (matches.length === 0) continue
    shown.add(gap.line)
    for (const match of matches) shown.add(match.line)
  }
  return [...shown]
}

/**
 * Snaps a box being dragged to the others: edges and centres line up, and
 * gaps repeat the ones next to it. `threshold` is in flow units.
 */
export function snapRect(moving: Rect, others: readonly Rect[], threshold: number): SnapResult {
  const dx = snapOffset(moving, others, 'x', threshold)
  const movedX = shift(moving, 'x', dx)
  const dy = snapOffset(movedX, others, 'y', threshold)
  const snapped = shift(movedX, 'y', dy)
  return {
    dx,
    dy,
    guides: {
      align: [...alignLines(snapped, others, 'x'), ...alignLines(snapped, others, 'y')],
      gaps: [...equalGaps(snapped, others, 'x'), ...equalGaps(snapped, others, 'y')]
    }
  }
}
