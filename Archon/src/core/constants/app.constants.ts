// Pure data: shared by the renderer and the main process.
import type { AccentColor, AppSettings } from '@/core/types/settings.types'
import { INSPECTOR_WIDTH, SIDEBAR_WIDTH } from './layout.constants'

export const APP_NAME = 'SOAR Docs Studio'

/** React Query cache keys, grouped by domain to keep invalidation predictable. */
export const QUERY_KEYS = {
  appInfo: ['app', 'info'],
  settings: ['settings'],
  systemTheme: ['system', 'theme']
} as const

/** The four accents offered by the design; the first one is the default. */
export const ACCENT_OPTIONS: readonly AccentColor[] = ['#4F8EF7', '#22C55E', '#F59E0B', '#E8534F']

/** Interface zoom factors, cycled by Ctrl/Cmd + `=` / `-`. */
export const UI_ZOOM_STEPS: readonly number[] = [0.8, 0.9, 1, 1.1, 1.25, 1.5]
export const UI_ZOOM_DEFAULT = 1

/** Most recent workspaces remembered in settings. */
export const RECENT_WORKSPACES_LIMIT = 10

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'dark',
    accent: '#4F8EF7',
    nodeStyle: 'card',
    edgeStyle: 'curved',
    uiZoom: UI_ZOOM_DEFAULT
  },
  layout: {
    sidebar: { visible: true, width: SIDEBAR_WIDTH.default },
    inspector: { visible: true, width: INSPECTOR_WIDTH.default }
  },
  window: { bounds: null, maximized: false },
  recentWorkspaces: [],
  session: {}
}
