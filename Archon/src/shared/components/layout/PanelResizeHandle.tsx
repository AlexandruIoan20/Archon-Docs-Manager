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
  label: string
  className?: string
}

interface DragState {
  pointerId: number
  startX: number
  startValue: number
  frame: number
  /** Value computed on the last move, not yet sent to `onChange`. */
  pending?: number
}

const RESIZING_CLASS = 'panel-resizing'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** A 6px-wide vertical drag handle; knows nothing about what it resizes. */
export function PanelResizeHandle({
  value,
  min,
  max,
  step = PANEL_RESIZE_STEP,
  onChange,
  onReset,
  onDragChange,
  edge,
  label,
  className
}: PanelResizeHandleProps): React.JSX.Element {
  const drag = useRef<DragState | null>(null)
  const [dragging, setDragging] = useState(false)
  const direction = edge === 'end' ? 1 : -1

  const endDrag = (): void => {
    const state = drag.current
    if (!state) return
    // The drop position must land even if its animation frame has not run yet.
    cancelAnimationFrame(state.frame)
    if (state.pending !== undefined) onChange(state.pending)
    drag.current = null
    document.documentElement.classList.remove(RESIZING_CLASS)
    setDragging(false)
    onDragChange?.(false)
  }

  // Unmounting mid-drag (panel hidden by a shortcut) must not leave the cursor stuck.
  useEffect(
    () => () => {
      if (drag.current) document.documentElement.classList.remove(RESIZING_CLASS)
    },
    []
  )

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startValue: value,
      frame: 0
    }
    document.documentElement.classList.add(RESIZING_CLASS)
    setDragging(true)
    onDragChange?.(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const next = clamp(state.startValue + (event.clientX - state.startX) * direction, min, max)
    state.pending = next
    cancelAnimationFrame(state.frame)
    state.frame = requestAnimationFrame(() => {
      state.pending = undefined
      onChange(next)
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const deltas: Record<string, number> = { ArrowRight: step, ArrowLeft: -step }
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
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
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
        'group absolute inset-y-0 z-10 flex w-1.5 cursor-col-resize justify-center outline-none',
        edge === 'end' ? '-right-[3px]' : '-left-[3px]',
        className
      )}
    >
      <span
        className={cn(
          'h-full w-px transition-colors',
          dragging ? 'bg-accent' : 'group-hover:bg-accent group-focus-visible:bg-accent'
        )}
      />
    </div>
  )
}
