  import { useEffect, useEffectEvent, type RefObject } from 'react'

/**
 * Calls `handler` on a pointer press outside every element in `refs`.
 * Listens on `mousedown` so a menu closes before the click lands elsewhere.
 */
export function useClickOutside(
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  handler: (event: MouseEvent) => void,
  enabled = true
): void {
  const onPointerDown = useEffectEvent((event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Node)) return
    if (refs.some((ref) => ref.current?.contains(target))) return
    handler(event)
  })

  useEffect(() => {
    if (!enabled) return
    const listener = (event: MouseEvent): void => onPointerDown(event)
    document.addEventListener('mousedown', listener, true)
    return () => document.removeEventListener('mousedown', listener, true)
  }, [enabled])
}
