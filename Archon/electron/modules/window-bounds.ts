/**
 * Pure window geometry, kept free of Electron imports so it is unit-testable.
 */

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

export interface InitialBounds extends Rect {
  minWidth: number
  minHeight: number
}

export interface InitialBoundsInput {
  /** Work area of the display the window should open on when nothing is saved. */
  workArea: Rect
  /** Work areas of every connected display. */
  displays: readonly Rect[]
  preferred: Size
  min: Size
  /** Bounds saved by the previous session, if any. */
  saved?: Rect | null
}

/** Share of the work area the window may take on first launch. */
const MAX_WORK_AREA_RATIO = 0.9
/** Saved bounds are reused only if at least this share of them is on a display. */
const MIN_VISIBLE_RATIO = 0.5

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function fitAxis(target: number, min: number, available: number): [size: number, min: number] {
  // On screens smaller than the minimum, the minimum shrinks so the window stays visible.
  const effectiveMin = Math.min(min, available)
  return [clamp(target, effectiveMin, available), effectiveMin]
}

function intersectionArea(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return width > 0 && height > 0 ? width * height : 0
}

/** The display holding most of `rect`, if it holds at least half of it. */
function hostDisplay(rect: Rect, displays: readonly Rect[]): Rect | undefined {
  let best: Rect | undefined
  let bestArea = 0
  for (const display of displays) {
    const area = intersectionArea(rect, display)
    if (area > bestArea) [best, bestArea] = [display, area]
  }
  return bestArea >= rect.width * rect.height * MIN_VISIBLE_RATIO ? best : undefined
}

function centered(workArea: Rect, preferred: Size, min: Size): InitialBounds {
  const [width, minWidth] = fitAxis(
    Math.min(preferred.width, Math.floor(workArea.width * MAX_WORK_AREA_RATIO)),
    min.width,
    workArea.width
  )
  const [height, minHeight] = fitAxis(
    Math.min(preferred.height, Math.floor(workArea.height * MAX_WORK_AREA_RATIO)),
    min.height,
    workArea.height
  )
  return {
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    width,
    height,
    minWidth,
    minHeight
  }
}

/** Saved bounds, shrunk to fit their display and moved fully onto it. */
function restored(saved: Rect, display: Rect, min: Size): InitialBounds {
  const [width, minWidth] = fitAxis(saved.width, min.width, display.width)
  const [height, minHeight] = fitAxis(saved.height, min.height, display.height)
  return {
    x: clamp(saved.x, display.x, display.x + display.width - width),
    y: clamp(saved.y, display.y, display.y + display.height - height),
    width,
    height,
    minWidth,
    minHeight
  }
}

/**
 * Saved bounds win when at least half of them is on a connected display.
 * Otherwise the window is centered on `workArea` with the size
 * `clamp(min(preferred, 90% × workArea), min(minimum, workArea), workArea)` per axis.
 */
export function resolveInitialBounds({
  workArea,
  displays,
  preferred,
  min,
  saved
}: InitialBoundsInput): InitialBounds {
  const display = saved && saved.width > 0 && saved.height > 0 && hostDisplay(saved, displays)
  return display ? restored(saved, display, min) : centered(workArea, preferred, min)
}
