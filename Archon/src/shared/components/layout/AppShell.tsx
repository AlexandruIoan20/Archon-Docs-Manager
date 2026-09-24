import type { CSSProperties, ReactNode } from 'react'
import type { PanelLayout, PanelState } from '@/core/types'

export interface AppShellProps {
  layout: PanelLayout
  titleBar: ReactNode
  tabBar?: ReactNode
  /** A `Sidebar`; it places itself in the grid or as a drawer. */
  sidebar?: ReactNode
  main: ReactNode
  /**
   * Replaces the whole body (tab bar, panels, main) while keeping the title
   * and status bars, e.g. the screen shown when no workspace is open.
   */
  bodyOverride?: ReactNode
  /** An `InspectorPanel`; it places itself in the grid or as a drawer. */
  inspector?: ReactNode
  statusBar?: ReactNode
  /** Pointer down in the main area (closes drawers). */
  onMainPointerDown?: () => void
}

const columnWidth = (panel: PanelState): string =>
  panel.mode === 'docked' ? `${panel.width}px` : '0px'

/**
 * The window skeleton:
 * title bar / tab bar / [sidebar | main | inspector] / status bar.
 * Panels that are not docked get a 0px column; drawers float over the body.
 */
export function AppShell({
  layout,
  titleBar,
  tabBar,
  sidebar,
  main,
  bodyOverride,
  inspector,
  statusBar,
  onMainPointerDown
}: AppShellProps): React.JSX.Element {
  const style = {
    '--size-sidebar': columnWidth(layout.sidebar),
    '--size-inspector': columnWidth(layout.inspector)
  } as CSSProperties

  return (
    <div
      data-testid="app-shell"
      style={style}
      className="flex h-full min-w-0 flex-col overflow-hidden bg-bg text-fg"
    >
      {titleBar}
      {bodyOverride !== undefined ? (
        <main data-testid="app-body" className="min-h-0 min-w-0 flex-1 overflow-hidden bg-canvas">
          {bodyOverride}
        </main>
      ) : (
        <>
          {tabBar}
          <div
            data-testid="app-body"
            className="relative grid min-h-0 flex-1 grid-cols-[[sidebar]_var(--size-sidebar)_[main]_minmax(0,1fr)_[inspector]_var(--size-inspector)] grid-rows-[minmax(0,1fr)] overflow-hidden"
          >
            {sidebar}
            <main
              onPointerDown={onMainPointerDown}
              className="col-start-2 row-start-1 flex min-h-0 min-w-0 flex-col overflow-auto bg-canvas"
            >
              {main}
            </main>
            {inspector}
          </div>
        </>
      )}
      {statusBar}
    </div>
  )
}
