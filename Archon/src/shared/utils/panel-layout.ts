import type {
  PanelId,
  PanelLayout,
  PanelLayoutInput,
  PanelMode,
  PanelPreference
} from '@/core/types'
import { MAIN_MIN_WITH_INSPECTOR, MAIN_MIN_WITH_SIDEBAR } from '@/core/constants/layout.constants'

function modeFor(pref: PanelPreference, fits: boolean): PanelMode {
  if (!pref.visible) return 'hidden'
  if (fits) return 'docked'
  // Space hid the panel; it comes back only as a drawer the user asked for.
  return pref.overlayOpen ? 'overlay' : 'hidden'
}

/**
 * Decides how the side panels are laid out for a window width.
 * The thresholds move with the panel widths, so widening a panel hides the
 * other one sooner instead of squeezing the main area.
 */
export function resolvePanelLayout({
  width,
  sidebar,
  inspector,
  lastOverlay
}: PanelLayoutInput): PanelLayout {
  const sidebarFits = width >= sidebar.width + MAIN_MIN_WITH_SIDEBAR
  // A sidebar the user wants counts against the inspector even while space hides it,
  // otherwise the inspector would dock in the room the sidebar is waiting for.
  const sidebarShare = sidebar.visible ? sidebar.width : 0
  const inspectorFits = width >= sidebarShare + inspector.width + MAIN_MIN_WITH_INSPECTOR

  let sidebarMode = modeFor(sidebar, sidebarFits)
  let inspectorMode = modeFor(inspector, inspectorFits)

  if (sidebarMode === 'overlay' && inspectorMode === 'overlay') {
    const keep: PanelId = lastOverlay ?? 'inspector'
    if (keep === 'inspector') sidebarMode = 'hidden'
    else inspectorMode = 'hidden'
  }

  return {
    sidebar: { mode: sidebarMode, width: sidebar.width, fits: sidebarFits },
    inspector: { mode: inspectorMode, width: inspector.width, fits: inspectorFits }
  }
}
