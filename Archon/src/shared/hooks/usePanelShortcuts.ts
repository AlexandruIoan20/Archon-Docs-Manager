import type { PanelLayout } from '@/core/types'
import { useUiStore } from '@/store'
import { useShortcuts } from './useKeyboard'

/** `Ctrl/Cmd+B` toggles the sidebar, `Ctrl/Cmd+Alt+B` the inspector (see the registry). */
export function usePanelShortcuts(layout: PanelLayout): void {
  const togglePanel = useUiStore((s) => s.togglePanel)
  useShortcuts({
    'panel.sidebar': () => togglePanel('sidebar', !layout.sidebar.fits),
    'panel.inspector': () => togglePanel('inspector', !layout.inspector.fits)
  })
}
