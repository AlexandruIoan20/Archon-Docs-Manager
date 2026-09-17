export type PanelId = 'sidebar' | 'inspector'

/**
 * - `docked`: a grid column next to the main area;
 * - `overlay`: a drawer over the main area, when there is no room to dock;
 * - `hidden`: not rendered.
 */
export type PanelMode = 'docked' | 'overlay' | 'hidden'

/** What the user asked for; kept even while space hides the panel. */
export interface PanelPreference {
  visible: boolean
  width: number
  /** Opened explicitly as a drawer while space kept it from docking. */
  overlayOpen: boolean
}

export interface PanelState {
  mode: PanelMode
  width: number
  /** Whether the window has room to dock this panel if it were visible. */
  fits: boolean
}

export type PanelLayout = Record<PanelId, PanelState>

export interface PanelLayoutInput {
  /** Window width, CSS px. */
  width: number
  sidebar: PanelPreference
  inspector: PanelPreference
  /** Tie-break when both panels ask for an overlay: the last one opened wins. */
  lastOverlay?: PanelId | null
}
