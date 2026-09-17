import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import type { AppPlatform } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { TITLEBAR_INSETS, type TitleBarDensity } from '@/core/constants/layout.constants'
import { Divider } from '@/shared/components/ui'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { cn } from '@/shared/utils/cn'
import { BrandMark } from './title-bar/BrandMark'
import { ThemeToggleButton, type ThemeToggleValue } from './title-bar/ThemeToggleButton'
import { TitleBarDensityContext } from './title-bar/TitleBarDensityContext'
import { WindowControls } from './title-bar/WindowControls'
import { resolveTitleBarDensity } from './title-bar/title-bar-density'

export interface TitleBarProps {
  /** Left slot: the active editor's tools. */
  toolbar?: ReactNode
  /** Right slot: the active editor's actions (Export). */
  actions?: ReactNode
  theme?: ThemeToggleValue
  onToggleTheme?: () => void
}

const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [contenteditable]'

// Width of the Windows caption buttons, read from the Window Controls Overlay
// geometry when Chromium exposes it.
const WINDOWS_OVERLAY_WIDTH =
  'calc(100vw - env(titlebar-area-x, 0px) - ' +
  `env(titlebar-area-width, calc(100vw - ${TITLEBAR_INSETS.windowsOverlay}px)))`

const hasContent = (node: ReactNode): boolean => node != null && node !== false

/** Space kept free for OS-drawn controls, plus the bar's own edge padding. */
function edgeInsets(platform: AppPlatform | undefined, padding: number): CSSProperties {
  switch (platform) {
    case 'darwin':
      return { paddingLeft: TITLEBAR_INSETS.macTrafficLights, paddingRight: padding }
    case 'win32':
      return { paddingLeft: padding, paddingRight: `calc(${WINDOWS_OVERLAY_WIDTH} + ${padding}px)` }
    case 'linux':
      // Our own controls sit flush with the right edge.
      return { paddingLeft: padding, paddingRight: 0 }
    default:
      return { paddingLeft: padding, paddingRight: padding }
  }
}

function useDensity(width: number): TitleBarDensity {
  // Hysteresis needs the previous density: adjusting state during render is
  // React's pattern for that, and it settles after one extra render.
  const [density, setDensity] = useState<TitleBarDensity>(() => resolveTitleBarDensity(width))
  const next = resolveTitleBarDensity(width, density)
  if (next !== density) setDensity(next)
  return next
}

export function TitleBar({
  toolbar,
  actions,
  theme,
  onToggleTheme
}: TitleBarProps): React.JSX.Element {
  const platform = usePlatform()
  const [measureRef, { width }] = useElementSize<HTMLDivElement>()
  const density = useDensity(width)
  const minimal = density === 'minimal'
  const padding = minimal ? 8 : 12
  const showToolbar = hasContent(toolbar)
  const showActions = hasContent(actions)
  const showThemeToggle = theme !== undefined && onToggleTheme !== undefined

  const onDoubleClick = (event: MouseEvent<HTMLElement>): void => {
    // Linux frameless windows get no native double-click-to-maximize.
    if (platform !== 'linux') return
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
    void ipcClient.window.toggleMaximize()
  }

  return (
    <TitleBarDensityContext.Provider value={density}>
      <header
        data-density={density}
        onDoubleClick={onDoubleClick}
        style={edgeInsets(platform, padding)}
        className="app-drag flex h-[var(--size-titlebar)] shrink-0 items-center border-b border-border bg-bg text-fg"
      >
        <div
          ref={measureRef}
          className={cn('flex h-full min-w-0 flex-1 items-center', minimal ? 'gap-1.5' : 'gap-2.5')}
        >
          <BrandMark compact={minimal} />
          {showToolbar && (
            <>
              <Divider />
              <div
                data-slot="toolbar"
                className={cn(
                  'flex min-w-0 items-center overflow-hidden',
                  minimal ? 'gap-1.5' : 'gap-2.5'
                )}
              >
                {toolbar}
              </div>
            </>
          )}
          {/* Free space: the main drag handle. */}
          <div className="h-full min-w-0 flex-1" />
          {showActions && (
            <div data-slot="actions" className="flex shrink-0 items-center gap-1.5">
              {actions}
            </div>
          )}
          {showActions && showThemeToggle && <Divider />}
          {showThemeToggle && <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />}
        </div>
        {platform === 'linux' && (
          <div className={cn('flex h-full shrink-0', showThemeToggle && 'ml-2')}>
            <WindowControls />
          </div>
        )}
      </header>
    </TitleBarDensityContext.Provider>
  )
}
