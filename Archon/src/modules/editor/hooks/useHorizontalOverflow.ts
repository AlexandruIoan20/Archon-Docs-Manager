import { useCallback, useEffect, useState, type RefObject } from 'react'

export interface HorizontalOverflow {
  overflowing: boolean
  /** Scrolled fully to the left (no hidden content there). */
  atStart: boolean
  atEnd: boolean
}

const NONE: HorizontalOverflow = { overflowing: false, atStart: true, atEnd: true }

/** Sub-pixel scroll positions count as the edge. */
const EDGE_TOLERANCE = 1

function measure(element: HTMLElement): HorizontalOverflow {
  const { scrollLeft, scrollWidth, clientWidth } = element
  const overflowing = scrollWidth - clientWidth > EDGE_TOLERANCE
  if (!overflowing) return NONE
  return {
    overflowing,
    atStart: scrollLeft <= EDGE_TOLERANCE,
    atEnd: scrollLeft + clientWidth >= scrollWidth - EDGE_TOLERANCE
  }
}

const same = (a: HorizontalOverflow, b: HorizontalOverflow): boolean =>
  a.overflowing === b.overflowing && a.atStart === b.atStart && a.atEnd === b.atEnd

/**
 * Whether a horizontally scrolling element hides content, and on which side.
 * Re-measures on scroll, on resize and when `contentKey` changes (items added).
 */
export function useHorizontalOverflow(
  ref: RefObject<HTMLElement | null>,
  contentKey: unknown
): HorizontalOverflow {
  const [state, setState] = useState<HorizontalOverflow>(NONE)

  const update = useCallback(() => {
    const element = ref.current
    if (!element) return
    const next = measure(element)
    setState((prev) => (same(prev, next) ? prev : next))
  }, [ref])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(element)
    return () => {
      element.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [ref, update])

  useEffect(update, [contentKey, update])

  return state
}
