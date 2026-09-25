import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { PANEL_RESIZE_STEP } from '@/core/constants/layout.constants'
import { cn } from '@/shared/utils/cn'

export interface PanelResizeHandleProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Double-click: back to the default size. */
  onReset?: () => void
  onDragChange?: (dragging: boolean) => void
  /**
   * Which edge of the resized element the handle sits on. `end` (right edge)
   * grows when dragged right; `start` (left edge) grows when dragged left.
   */
  edge: 'start' | 'end'
  /**
   * `vertical` (default): a vertical bar resizing a width. `horizontal`: a
   * horizontal bar resizing a height; `end` is then the bottom edge.
   */
  orientation?: 'vertical' | 'horizontal'
  /** Value units per dragged pixel, e.g. `100 / width` for a percentage. */
  scale?: number
  label: string
  className?: string
}

interface DragState {
  pointerId: number
  start: number
  startValue: number
  frame: number
  /** Value computed on the last move, not yet sent to `onChange`. */
  pending?: number
}

const RESIZING_CLASS = 'panel-resizing'
const ROW_RESIZING_CLASS = 'panel-resizing-row'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** A 6px-wide drag handle, vertical or horizontal; knows nothing about what it resizes. */
export function PanelResizeHandle({
  value,
  min,
  max,
  step = PANEL_RESIZE_STEP,
  onChange,
  onReset,
  onDragChange,
  edge,
  orientation = 'vertical',
  scale = 1,
  label,
  className
}: PanelResizeHandleProps): React.JSX.Element {
  const drag = useRef<DragState | null>(null)
  const [dragging, setDragging] = useState(false)
  const direction = edge === 'end' ? 1 : -1
  const vertical = orientation === 'vertical'
  const resizingClasses = vertical ? [RESIZING_CLASS] : [RESIZING_CLASS, ROW_RESIZING_CLASS]
  const pointerAt = (event: PointerEvent<HTMLDivElement>): number =>
    vertical ? event.clientX : event.clientY

  const endDrag = (): void => {
    const state = drag.current
    if (!state) return
    // The drop position must land even if its animation frame has not run yet.
    cancelAnimationFrame(state.frame)
    if (state.pending !== undefined) onChange(state.pending)
    drag.current = null
    document.documentElement.classList.remove(...resizingClasses)
    setDragging(false)
    onDragChange?.(false)
  }

  // Unmounting mid-drag (panel hidden by a shortcut) must not leave the cursor stuck.
  useEffect(
    () => () => {
      if (drag.current) {
        document.documentElement.classList.remove(RESIZING_CLASS, ROW_RESIZING_CLASS)
      }
    },
    []
  )

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      start: pointerAt(event),
      startValue: value,
      frame: 0
    }
    document.documentElement.classList.add(...resizingClasses)
    setDragging(true)
    onDragChange?.(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const delta = (pointerAt(event) - state.start) * scale * direction
    const next = clamp(state.startValue + delta, min, max)
    state.pending = next
    cancelAnimationFrame(state.frame)
    state.frame = requestAnimationFrame(() => {
      state.pending = undefined
      onChange(next)
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const deltas: Record<string, number> = vertical
      ? { ArrowRight: step, ArrowLeft: -step }
      : { ArrowDown: step, ArrowUp: -step }
    let next: number | undefined
    if (event.key in deltas) next = value + (deltas[event.key] ?? 0) * direction
    else if (event.key === 'Home') next = min
    else if (event.key === 'End') next = max
    if (next === undefined) return
    event.preventDefault()
    onChange(clamp(next, min, max))
  }

  return (
    <div
      role="separator"
      data-dragging={dragging || undefined}
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={cn(
        'group absolute z-10 flex outline-none',
        vertical
          ? cn(
              'inset-y-0 w-1.5 cursor-col-resize justify-center',
              edge === 'end' ? '-right-[3px]' : '-left-[3px]'
            )
          : cn(
              'inset-x-0 h-1.5 cursor-row-resize flex-col justify-center',
              edge === 'end' ? '-bottom-[3px]' : '-top-[3px]'
            ),
        className
      )}
    >
      <span
        className={cn(
          vertical ? 'h-full w-px' : 'h-px w-full',
          'transition-colors',
          dragging ? 'bg-accent' : 'group-hover:bg-accent group-focus-visible:bg-accent'
        )}
      />
    </div>
  )
}
