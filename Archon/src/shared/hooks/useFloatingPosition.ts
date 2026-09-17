import { useLayoutEffect, useEffectEvent, type RefObject } from 'react'
import {
  computeFloatingPosition,
  type FloatingPlacement,
  type Rect
} from '@/shared/utils/floating-position'

export type FloatingAnchor = RefObject<HTMLElement | null> | { x: number; y: number }

export interface FloatingOptions {
  open: boolean
  anchor: FloatingAnchor
  placement: FloatingPlacement
  offset?: number
  /** Makes the element at least as wide as its anchor (split-button menus). */
  matchAnchorWidth?: boolean
}

function anchorRect(anchor: FloatingAnchor): Rect | null {
  if (!('current' in anchor)) return { x: anchor.x, y: anchor.y, width: 0, height: 0 }
  const rect = anchor.current?.getBoundingClientRect()
  return rect ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null
}

/**
 * Positions `floatingRef` (a `position: fixed` element) next to its anchor and
 * keeps it inside the window while it is open. Styles are written directly to
 * the element: positioning is layout work, not React state.
 *
 * The element should start with `visibility: hidden`; it becomes visible once
 * placed, so it never flashes at the wrong spot.
 */
export function useFloatingPosition(
  floatingRef: RefObject<HTMLElement | null>,
  { open, anchor, placement, offset, matchAnchorWidth = false }: FloatingOptions
): void {
  const update = useEffectEvent(() => {
    const element = floatingRef.current
    const rect = anchorRect(anchor)
    if (!element || !rect) return
    if (matchAnchorWidth) element.style.minWidth = `${rect.width}px`

    const { x, y, maxHeight } = computeFloatingPosition({
      anchor: rect,
      // scrollHeight is the natural height, even after maxHeight clamps it.
      floating: { width: element.offsetWidth, height: element.scrollHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      placement,
      offset
    })
    element.style.left = `${x}px`
    element.style.top = `${y}px`
    element.style.maxHeight = `${maxHeight}px`
    element.style.visibility = 'visible'
  })

  useLayoutEffect(() => {
    if (!open) return
    update()

    const onChange = (): void => update()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onChange)
    if (floatingRef.current) observer?.observe(floatingRef.current)

    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      observer?.disconnect()
    }
  }, [open, floatingRef])
}
