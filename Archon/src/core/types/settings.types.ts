/**
 * App-level preferences, stored by the main process in `userData/settings.json`.
 * They belong to the app, not to a workspace. A workspace (`.soarws`) may later
 * override the theme; its field defaults to `'inherit'` (plan 07).
 */

export type ThemePreference = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'
export type AccentColor = '#4F8EF7' | '#22C55E' | '#F59E0B' | '#E8534F'
export type NodeStyle = 'card' | 'outline' | 'solid'
export type EdgeStyle = 'curved' | 'orthogonal' | 'straight'

export interface AppearanceSettings {
  theme: ThemePreference
  accent: AccentColor
  nodeStyle: NodeStyle
  edgeStyle: EdgeStyle
  /** Interface zoom factor, one of `UI_ZOOM_STEPS`. */
  uiZoom: number
}

export interface PanelSettings {
  visible: boolean
  width: number
}

export interface LayoutSettings {
  sidebar: PanelSettings
  inspector: PanelSettings
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowSettings {
  /** Restored (non-maximized) bounds; `null` until the window is first moved or sized. */
  bounds: WindowBounds | null
  maximized: boolean
}

/** What the app restores on the next launch. Plan 11 adds the open tabs. */
export interface SessionSettings {
  /** Root of the workspace open at quit; `null` after an explicit close. */
  lastWorkspace?: string | null
  /** Expanded folder paths, per workspace id (plan 08). */
  expandedByWorkspace?: Record<string, string[]>
  [key: string]: unknown
}

export interface AppSettings {
  appearance: AppearanceSettings
  layout: LayoutSettings
  window: WindowSettings
  /** Most recent first (plan 07). */
  recentWorkspaces: string[]
  session: SessionSettings
}

/** Nested objects merge key by key; arrays and `null` replace the stored value. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

export type SettingsPatch = DeepPartial<AppSettings>
