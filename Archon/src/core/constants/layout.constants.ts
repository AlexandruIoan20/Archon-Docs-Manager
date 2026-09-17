// Pure data: shared by the renderer and the main process (window chrome sizes).

export const LAYOUT = {
  titlebar: 48,
  tabbar: 36,
  sidebar: 260,
  sidebarHeader: 44,
  inspector: 240,
  inspectorHeader: 40,
  statusbar: 24
} as const

export interface PanelWidthLimits {
  default: number
  min: number
  max: number
}

export const SIDEBAR_WIDTH: PanelWidthLimits = { default: 260, min: 200, max: 420 }
export const INSPECTOR_WIDTH: PanelWidthLimits = { default: 240, min: 220, max: 380 }

/** The inspector docks only if the main area keeps at least this much. */
export const MAIN_MIN_WITH_INSPECTOR = 600
/** The sidebar docks only if the main area keeps at least this much. */
export const MAIN_MIN_WITH_SIDEBAR = 640
/** Keyboard resize step for panel handles. */
export const PANEL_RESIZE_STEP = 16
/** Overlay drawers leave this much of the main area uncovered. */
export const OVERLAY_EDGE_GAP = 48

/**
 * Title bar density thresholds, applied to the bar's available width (native
 * window controls excluded). Moving up a level needs `hysteresis` extra pixels
 * so the bar does not flicker when the width sits on a threshold.
 */
export const TITLEBAR_DENSITY = { full: 1000, compact: 700, hysteresis: 24 } as const

export type TitleBarDensity = 'full' | 'compact' | 'minimal'

/** Space the title bar leaves free for OS-drawn window controls. */
export const TITLEBAR_INSETS = {
  /** macOS traffic lights (left). */
  macTrafficLights: 78,
  /** Windows caption buttons overlay (right), used when `env(titlebar-area-*)` is missing. */
  windowsOverlay: 138
} as const

/** Custom Linux window control button size. */
export const WINDOW_CONTROL_WIDTH = 46
