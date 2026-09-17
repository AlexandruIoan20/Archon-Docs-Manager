import { useMemo } from 'react'
import type { PanelId } from '@/core/types'
import { PANEL_WIDTH_LIMITS, useUiStore } from '@/store'
import type { SidePanelResize } from '@/shared/components/layout/SidePanel'

/** Resize wiring between a side panel's handle and the ui store. */
export function usePanelResize(id: PanelId): SidePanelResize {
  const setPanelWidth = useUiStore((s) => s.setPanelWidth)
  const resetPanelWidth = useUiStore((s) => s.resetPanelWidth)
  const setPanelResizing = useUiStore((s) => s.setPanelResizing)

  return useMemo(
    () => ({
      min: PANEL_WIDTH_LIMITS[id].min,
      max: PANEL_WIDTH_LIMITS[id].max,
      onChange: (width: number) => setPanelWidth(id, width),
      onReset: () => resetPanelWidth(id),
      onDragChange: setPanelResizing
    }),
    [id, setPanelWidth, resetPanelWidth, setPanelResizing]
  )
}
