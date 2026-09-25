import { useCallback } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { UI_ZOOM_DEFAULT, UI_ZOOM_STEPS } from '@/core/constants/app.constants'
import { useUiStore } from '@/store'
import { useShortcuts } from './useKeyboard'
import { useSettings, useUpdateSettings } from './useSettings'

export interface UiZoomControls {
  zoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

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
  const notify = useUiStore((s) => s.notify)

  const setZoom = useCallback(
    (factor: number) => {
      if (factor === zoom) return
      void ipcClient.window.setZoom(factor).catch(console.error)
      updateSettings({ appearance: { uiZoom: factor } })
      notify(`Zoom ${Math.round(factor * 100)}%`)
    },
    [zoom, updateSettings, notify]
  )

  const zoomIn = useCallback(() => setZoom(stepZoom(zoom, 1)), [setZoom, zoom])
  const zoomOut = useCallback(() => setZoom(stepZoom(zoom, -1)), [setZoom, zoom])
  const resetZoom = useCallback(() => setZoom(UI_ZOOM_DEFAULT), [setZoom])

  useShortcuts({ 'zoom.in': zoomIn, 'zoom.out': zoomOut, 'zoom.reset': resetZoom })

  return { zoom, zoomIn, zoomOut, resetZoom }
}
