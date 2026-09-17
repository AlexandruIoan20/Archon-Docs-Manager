import type { AccentColor, AppearanceSettings, ResolvedTheme, TitleBarColors } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'

export function resolveTheme(
  preference: AppearanceSettings['theme'],
  system: ResolvedTheme | undefined
): ResolvedTheme {
  if (preference !== 'system') return preference
  return system ?? 'dark'
}

/**
 * Applies the theme to the document. The default accent is left to the theme
 * CSS (light mode uses a deeper blue); any other accent overrides both themes,
 * and every accent derivative follows through `color-mix`.
 */
export function applyTheme(
  theme: ResolvedTheme,
  accent: AccentColor,
  root: HTMLElement = document.documentElement
): void {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  if (accent === DEFAULT_SETTINGS.appearance.accent) root.style.removeProperty('--accent')
  else root.style.setProperty('--accent', accent)
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i

/** Native title bar colors taken from the applied theme (`--bg`, `--text2`). */
export function readTitleBarColors(
  root: HTMLElement = document.documentElement
): TitleBarColors | null {
  const styles = getComputedStyle(root)
  const color = styles.getPropertyValue('--bg').trim()
  const symbolColor = styles.getPropertyValue('--text2').trim()
  return HEX_COLOR.test(color) && HEX_COLOR.test(symbolColor) ? { color, symbolColor } : null
}
