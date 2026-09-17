import { useEffect, useEffectEvent } from 'react'
import type { LayoutSettings, PanelPreference } from '@/core/types'
import { useUiStore, type UiState } from '@/store'
import { useUpdateSettings } from './useSettings'

export const LAYOUT_SAVE_DELAY_MS = 300

const toSettings = ({ sidebar, inspector }: UiState['panels']): LayoutSettings => ({
  sidebar: { visible: sidebar.visible, width: sidebar.width },
  inspector: { visible: inspector.visible, width: inspector.width }
})

const samePanel = (a: PanelPreference, b: PanelPreference): boolean =>
  a.visible === b.visible && a.width === b.width

/**
 * Saves panel widths and visibility. Drawer state is not saved, and nothing is
 * written while an edge is being dragged: the drop triggers one write.
 * Hydration happens earlier, in `main.tsx` (`hydratePanels`).
 */
export function useLayoutPersistence(): void {
  const { mutate: updateSettings } = useUpdateSettings()
  const save = useEffectEvent((layout: LayoutSettings) => updateSettings({ layout }))

  useEffect(() => {
    let timer: number | undefined

    const unsubscribe = useUiStore.subscribe((state, prev) => {
      const panelsChanged =
        !samePanel(state.panels.sidebar, prev.panels.sidebar) ||
        !samePanel(state.panels.inspector, prev.panels.inspector)
      const dragEnded = prev.panelResizing && !state.panelResizing
      if (!panelsChanged && !dragEnded) return

      window.clearTimeout(timer)
      if (state.panelResizing) return
      timer = window.setTimeout(() => {
        const current = useUiStore.getState()
        if (!current.panelResizing) save(toSettings(current.panels))
      }, LAYOUT_SAVE_DELAY_MS)
    })

    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
