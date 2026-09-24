export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 2
export const ZOOM_STEP = 0.1

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/** The next 10% step up (`1`) or down (`-1`), snapped to the step and kept in range. */
export function stepZoom(zoom: number, direction: 1 | -1): number {
  const steps = zoom / ZOOM_STEP
  // A zoom between steps goes to the neighbouring step, not one further.
  const next = direction === 1 ? Math.floor(steps + 1e-6) + 1 : Math.ceil(steps - 1e-6) - 1
  return clampZoom(Math.round(next * ZOOM_STEP * 100) / 100)
}
