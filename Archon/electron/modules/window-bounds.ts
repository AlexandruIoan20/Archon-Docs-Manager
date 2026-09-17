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

/** Share of the work area the window may take on first launch. */
const MAX_WORK_AREA_RATIO = 0.9

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function fitAxis(preferred: number, min: number, available: number): [size: number, min: number] {
  // On screens smaller than the minimum, the minimum shrinks so the window stays visible.
  const effectiveMin = Math.min(min, available)
  const target = Math.min(preferred, Math.floor(available * MAX_WORK_AREA_RATIO))
  return [clamp(target, effectiveMin, available), effectiveMin]
}

/**
 * Size: `clamp(min(preferred, 90% × workArea), min(minimum, workArea), workArea)`
 * per axis. The window is centered in the work area.
 */
export function resolveInitialBounds(workArea: Rect, preferred: Size, min: Size): InitialBounds {
  const [width, minWidth] = fitAxis(preferred.width, min.width, workArea.width)
  const [height, minHeight] = fitAxis(preferred.height, min.height, workArea.height)

  return {
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    width,
    height,
    minWidth,
    minHeight
  }
}
