import type {
  AppSettings,
  AppearanceSettings,
  LayoutSettings,
  PanelSettings,
  SessionSettings,
  SettingsPatch,
  WindowBounds,
  WindowSettings
} from '@/core/types/settings.types'
import {
  ACCENT_OPTIONS,
  DEFAULT_SETTINGS,
  RECENT_WORKSPACES_LIMIT,
  UI_ZOOM_STEPS
} from '@/core/constants/app.constants'
import {
  INSPECTOR_WIDTH,
  SIDEBAR_WIDTH,
  type PanelWidthLimits
} from '@/core/constants/layout.constants'

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

/** Snaps any factor to the closest allowed zoom step. */
export function snapUiZoom(value: unknown): number {
  if (!isFiniteNumber(value)) return DEFAULT_SETTINGS.appearance.uiZoom
  return UI_ZOOM_STEPS.reduce((best, step) =>
    Math.abs(step - value) < Math.abs(best - value) ? step : best
  )
}

function normalizeAppearance(raw: unknown): AppearanceSettings {
  const src = isObject(raw) ? raw : {}
  const fallback = DEFAULT_SETTINGS.appearance
  const accent = typeof src.accent === 'string' ? src.accent.toUpperCase() : undefined
  return {
    theme: pick(src.theme, ['dark', 'light', 'system'] as const, fallback.theme),
    accent: pick(accent, ACCENT_OPTIONS, fallback.accent),
    nodeStyle: pick(src.nodeStyle, ['card', 'outline', 'solid'] as const, fallback.nodeStyle),
    edgeStyle: pick(
      src.edgeStyle,
      ['curved', 'orthogonal', 'straight'] as const,
      fallback.edgeStyle
    ),
    uiZoom: snapUiZoom(src.uiZoom)
  }
}

function normalizePanel(raw: unknown, limits: PanelWidthLimits): PanelSettings {
  const src = isObject(raw) ? raw : {}
  const width = isFiniteNumber(src.width) ? src.width : limits.default
  return {
    visible: bool(src.visible, true),
    width: Math.round(Math.min(Math.max(width, limits.min), limits.max))
  }
}

function normalizeLayout(raw: unknown): LayoutSettings {
  const src = isObject(raw) ? raw : {}
  return {
    sidebar: normalizePanel(src.sidebar, SIDEBAR_WIDTH),
    inspector: normalizePanel(src.inspector, INSPECTOR_WIDTH)
  }
}

function normalizeBounds(raw: unknown): WindowBounds | null {
  if (!isObject(raw)) return null
  const { x, y, width, height } = raw
  if (![x, y, width, height].every(isFiniteNumber)) return null
  const rect = { x, y, width, height } as WindowBounds
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }
}

function normalizeWindow(raw: unknown): WindowSettings {
  const src = isObject(raw) ? raw : {}
  return { bounds: normalizeBounds(src.bounds), maximized: bool(src.maximized, false) }
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const items = raw.filter((item): item is string => typeof item === 'string' && item !== '')
  return [...new Set(items)]
}

function normalizeRecent(raw: unknown): string[] {
  return stringList(raw).slice(0, RECENT_WORKSPACES_LIMIT)
}

function normalizeSession(raw: unknown): SessionSettings {
  if (!isObject(raw)) return {}
  const session: SessionSettings = { ...raw }
  const { lastWorkspace, expandedByWorkspace } = raw
  if (lastWorkspace !== undefined) {
    session.lastWorkspace =
      typeof lastWorkspace === 'string' && lastWorkspace !== '' ? lastWorkspace : null
  }
  if (expandedByWorkspace !== undefined) {
    const byWorkspace: Record<string, string[]> = {}
    if (isObject(expandedByWorkspace)) {
      for (const [id, paths] of Object.entries(expandedByWorkspace)) {
        byWorkspace[id] = stringList(paths)
      }
    }
    session.expandedByWorkspace = byWorkspace
  }
  return session
}

/**
 * Turns anything read from disk (or sent over IPC) into valid settings:
 * unknown or invalid values fall back to the defaults, one field at a time.
 */
export function normalizeSettings(raw: unknown): AppSettings {
  const src = isObject(raw) ? raw : {}
  return {
    appearance: normalizeAppearance(src.appearance),
    layout: normalizeLayout(src.layout),
    window: normalizeWindow(src.window),
    recentWorkspaces: normalizeRecent(src.recentWorkspaces),
    session: normalizeSession(src.session)
  }
}

function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isObject(base) || !isObject(patch)) return patch === undefined ? base : patch
  const result: Json = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) result[key] = deepMerge(base[key], value)
  }
  return result
}

/** Applies a partial update, then validates the result. */
export function mergeSettings(current: AppSettings, patch: SettingsPatch): AppSettings {
  return normalizeSettings(deepMerge(current, patch))
}
