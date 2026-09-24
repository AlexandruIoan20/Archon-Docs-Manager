import type { AppPlatform } from '@/core/types'

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
