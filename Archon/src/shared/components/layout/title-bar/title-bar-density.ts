import { TITLEBAR_DENSITY, type TitleBarDensity } from '@/core/constants/layout.constants'

const RANK: Record<TitleBarDensity, number> = { minimal: 0, compact: 1, full: 2 }

function densityAt(width: number): TitleBarDensity {
  if (width >= TITLEBAR_DENSITY.full) return 'full'
  if (width >= TITLEBAR_DENSITY.compact) return 'compact'
  return 'minimal'
}

/**
 * Picks the title bar density for the available width.
 * Dropping to a denser level happens at the threshold; moving back up needs
 * `hysteresis` extra pixels, so a width resting on a threshold does not flicker.
 * A width of 0 means "not measured yet" and keeps the previous density.
 */
export function resolveTitleBarDensity(
  availableWidth: number,
  previous?: TitleBarDensity
): TitleBarDensity {
  if (availableWidth <= 0) return previous ?? 'full'

  const target = densityAt(availableWidth)
  if (!previous || RANK[target] <= RANK[previous]) return target

  const withMargin = densityAt(availableWidth - TITLEBAR_DENSITY.hysteresis)
  return RANK[withMargin] > RANK[previous] ? withMargin : previous
}
