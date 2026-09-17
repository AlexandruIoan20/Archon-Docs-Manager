import type { ResolvedTheme } from '@/core/types'
import { IconButton } from '@/shared/components/ui'

export type ThemeToggleValue = ResolvedTheme

export interface ThemeToggleButtonProps {
  /** The theme currently shown; its icon is displayed (moon on dark, sun on light). */
  theme: ThemeToggleValue
  onToggle: () => void
}

/** Presentational only: `useTheme` owns the switch and its persistence. */
export function ThemeToggleButton({ theme, onToggle }: ThemeToggleButtonProps): React.JSX.Element {
  const next: ThemeToggleValue = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton
      icon={theme === 'dark' ? 'moon' : 'sun'}
      label={`Switch to ${next} theme`}
      variant="outline"
      size="lg"
      iconSize={15}
      onClick={onToggle}
    />
  )
}
