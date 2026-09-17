import { useEffect, useState, type RefCallback } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Tracks an element's border-box size. Attach the returned callback ref.
 * Updates are batched per animation frame, so dragging a panel re-renders
 * consumers at most once per frame.
 */
export function useElementSize<T extends HTMLElement>(): [RefCallback<T>, ElementSize] {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return
    let frame = 0

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize?.[0]
      const width = box ? box.inlineSize : element.offsetWidth
      const height = box ? box.blockSize : element.offsetHeight
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height }
        )
      )
    })
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [element])

  return [setElement, size]
}
