import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { PanelMode } from '@/core/types'
import { OVERLAY_EDGE_GAP } from '@/core/constants/layout.constants'
import { useEscape } from '@/shared/hooks/useEscape'
import { cn } from '@/shared/utils/cn'
import { PanelResizeHandle } from './PanelResizeHandle'

export interface SidePanelResize {
  min: number
  max: number
  onChange: (width: number) => void
  onReset: () => void
  onDragChange?: (dragging: boolean) => void
}

export interface SidePanelProps {
  mode: PanelMode
  width: number
  /** Window side the panel sits on: `start` (left) or `end` (right). */
  side: 'start' | 'end'
  label: string
  /** Closes the drawer (overlay mode only). */
  onClose: () => void
  /** Docked panels get a resize handle on their inner edge. */
  resize?: SidePanelResize
  className?: string
  children: ReactNode
}

/** Moves focus into an open drawer and gives it back when the drawer goes away. */
function useDrawerFocus(panel: React.RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.current?.focus({ preventScroll: true })
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [panel, active])
}

/**
 * Shared container for the sidebar and the inspector: a grid column when
 * docked, a drawer over the main area when there is no room to dock.
 */
export function SidePanel({
  mode,
  width,
  side,
  label,
  onClose,
  resize,
  className,
  children
}: SidePanelProps): React.JSX.Element | null {
  const ref = useRef<HTMLElement>(null)
  const overlay = mode === 'overlay'

  useEscape(onClose, overlay)
  useDrawerFocus(ref, overlay)

  if (mode === 'hidden') return null

  const style: CSSProperties | undefined = overlay
    ? { width: `min(${width}px, calc(100% - ${OVERLAY_EDGE_GAP}px))` }
    : undefined

  return (
    <aside
      ref={ref}
      aria-label={label}
      data-mode={mode}
      tabIndex={overlay ? -1 : undefined}
      style={style}
      className={cn(
        '@container flex min-h-0 min-w-0 flex-col outline-none',
        overlay
          ? cn(
              'absolute inset-y-0 z-30 shadow-menu motion-reduce:animate-none',
              side === 'start' ? 'left-0 animate-drawer-start' : 'right-0 animate-drawer-end'
            )
          : cn('relative row-start-1', side === 'start' ? 'col-start-1' : 'col-start-3'),
        className
      )}
    >
      {children}
      {!overlay && resize && (
        <PanelResizeHandle
          value={width}
          min={resize.min}
          max={resize.max}
          onChange={resize.onChange}
          onReset={resize.onReset}
          onDragChange={resize.onDragChange}
          edge={side === 'start' ? 'end' : 'start'}
          label={`Resize ${label.toLowerCase()}`}
        />
      )}
    </aside>
  )
}
