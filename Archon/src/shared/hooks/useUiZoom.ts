import { useCallback, useEffect, useEffectEvent } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { UI_ZOOM_DEFAULT, UI_ZOOM_STEPS } from '@/core/constants/app.constants'
import { useSettings, useUpdateSettings } from './useSettings'

export interface UiZoomControls {
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const ZOOM_IN_CODES = new Set(['Equal', 'NumpadAdd'])
const ZOOM_OUT_CODES = new Set(['Minus', 'NumpadSubtract'])
const ZOOM_RESET_CODES = new Set(['Digit0', 'Numpad0'])

/** The neighbouring step; stays put at either end. */
export function stepZoom(current: number, direction: 1 | -1): number {
  const index = UI_ZOOM_STEPS.indexOf(current)
  const from = index === -1 ? UI_ZOOM_STEPS.indexOf(UI_ZOOM_DEFAULT) : index
  const next = Math.min(Math.max(from + direction, 0), UI_ZOOM_STEPS.length - 1)
  return UI_ZOOM_STEPS[next] ?? UI_ZOOM_DEFAULT
}

/**
 * Interface zoom: Ctrl/Cmd + `=` / `-` / `0`. The factor is applied by main
 * (`webContents.setZoomFactor`) and persisted. Call it once, in `App.tsx`.
 */
export function useUiZoom(): UiZoomControls {
  const zoom = useSettings().appearance.uiZoom
  const { mutate: updateSettings } = useUpdateSettings()

  const setZoom = useCallback(
    (factor: number) => {
      if (factor === zoom) return
      void ipcClient.window.setZoom(factor).catch(console.error)
      updateSettings({ appearance: { uiZoom: factor } })
      // Plan 06 adds the "Zoom 125%" toast here.
    },
    [zoom, updateSettings]
  )

  const zoomIn = useCallback(() => setZoom(stepZoom(zoom, 1)), [setZoom, zoom])
  const zoomOut = useCallback(() => setZoom(stepZoom(zoom, -1)), [setZoom, zoom])
  const resetZoom = useCallback(() => setZoom(UI_ZOOM_DEFAULT), [setZoom])

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    // `code`, not `key`: `+` needs Shift on many layouts and Numpad keys differ.
    const action = ZOOM_IN_CODES.has(event.code)
      ? zoomIn
      : ZOOM_OUT_CODES.has(event.code)
        ? zoomOut
        : ZOOM_RESET_CODES.has(event.code)
          ? resetZoom
          : undefined
    if (!action) return
    event.preventDefault()
    action()
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  return { zoom, zoomIn, zoomOut, resetZoom }
}
