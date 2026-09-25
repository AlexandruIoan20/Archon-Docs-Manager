import type { AppPlatform } from '@/core/types'
import { getShortcut, type ShortcutId } from '@/core/constants/shortcuts'

/**
 * Label of the primary shortcut modifier, for messages such as "⌘Z to undo".
 * Unknown platform (not loaded yet) reads as `Ctrl`.
 */
export function modKeyLabel(platform: AppPlatform | undefined): '⌘' | 'Ctrl' {
  return platform === 'darwin' ? '⌘' : 'Ctrl'
}

/** A shortcut as shown to the user: `⌘Z` on macOS, `Ctrl+Z` elsewhere. */
export function formatShortcut(platform: AppPlatform | undefined, key: string): string {
  const mod = modKeyLabel(platform)
  return mod === '⌘' ? `${mod}${key}` : `${mod}+${key}`
}

const KEY_LABELS: Record<string, { mac: string; other: string }> = {
  enter: { mac: '⏎', other: 'Enter' },
  escape: { mac: 'Esc', other: 'Esc' },
  delete: { mac: 'Del', other: 'Del' },
  backspace: { mac: '⌫', other: 'Backspace' },
  tab: { mac: 'Tab', other: 'Tab' },
  plus: { mac: '+', other: '+' }
}

const MAC_MODIFIERS: Record<string, string> = { mod: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧' }
const OTHER_MODIFIERS: Record<string, string> = {
  mod: 'Ctrl',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift'
}

/** A registry combo (`mod+shift+z`) as shown: `⌘⇧Z` on macOS, `Ctrl+Shift+Z` elsewhere. */
export function formatCombo(platform: AppPlatform | undefined, combo: string): string {
  const mac = platform === 'darwin'
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop() ?? ''
  const label = KEY_LABELS[key]?.[mac ? 'mac' : 'other'] ?? key.toUpperCase()
  // Apple's order is ⌃⌥⇧⌘; elsewhere Ctrl+Alt+Shift.
  const order = mac ? ['ctrl', 'alt', 'shift', 'mod'] : ['mod', 'ctrl', 'alt', 'shift']
  const modifiers = order
    .filter((m) => parts.includes(m))
    .map((m) => (mac ? MAC_MODIFIERS : OTHER_MODIFIERS)[m])
  // `mod` and `ctrl` are one key off macOS.
  const unique = [...new Set(modifiers)]
  return mac ? `${unique.join('')}${label}` : [...unique, label].join('+')
}

/**
 * The OS from the user agent, synchronously. For labels only (tooltips), where
 * waiting for main (`usePlatform`) is not worth it; key handling uses main's answer.
 */
export function platformFromUserAgent(
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent
): AppPlatform {
  if (/Mac OS X|Macintosh/.test(userAgent)) return 'darwin'
  return /Windows/.test(userAgent) ? 'win32' : 'linux'
}

/** Standard `aria-keyshortcuts` value for a combo (`Control+Shift+Z`, `Meta+K`). */
export function ariaKeyShortcut(platform: AppPlatform | undefined, combo: string): string {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop() ?? ''
  const names: Record<string, string> = {
    mod: platform === 'darwin' ? 'Meta' : 'Control',
    ctrl: 'Control',
    alt: 'Alt',
    shift: 'Shift'
  }
  const keyName =
    key === 'plus'
      ? 'Plus'
      : key.length === 1
        ? key.toUpperCase()
        : key.charAt(0).toUpperCase() + key.slice(1)
  return [...parts.map((p) => names[p] ?? p), keyName].join('+')
}

/** How a registry shortcut reads on this platform (its first combo). */
export function shortcutLabel(platform: AppPlatform | undefined, id: ShortcutId): string {
  return formatCombo(platform, getShortcut(id).keys[0] ?? '')
}
