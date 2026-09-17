import { useEffect, useMemo } from 'react'
import type { PanelLayout } from '@/core/types'
import { useUiStore } from '@/store'
import { resolvePanelLayout } from '@/shared/utils/panel-layout'
import { useWindowSize } from './useWindowSize'

/**
 * The current panel layout. Call it once, in the shell composition, and pass
 * the result down: each call adds a window resize listener.
 */
export function usePanelLayout(): PanelLayout {
  const { width } = useWindowSize()
  const sidebar = useUiStore((s) => s.panels.sidebar)
  const inspector = useUiStore((s) => s.panels.inspector)
  const lastOverlay = useUiStore((s) => s.lastOverlay)
  const closeOverlay = useUiStore((s) => s.closeOverlay)

  const layout = useMemo(
    () => resolvePanelLayout({ width, sidebar, inspector, lastOverlay }),
    [width, sidebar, inspector, lastOverlay]
  )

  // A drawer request ends once the panel docks (or loses the tie-break),
  // so shrinking the window later does not pop the drawer open by itself.
  const staleSidebar = sidebar.overlayOpen && layout.sidebar.mode !== 'overlay'
  const staleInspector = inspector.overlayOpen && layout.inspector.mode !== 'overlay'
  useEffect(() => {
    if (staleSidebar) closeOverlay('sidebar')
    if (staleInspector) closeOverlay('inspector')
  }, [staleSidebar, staleInspector, closeOverlay])

  return layout
}
