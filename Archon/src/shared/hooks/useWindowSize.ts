import { useEffect, useState } from 'react'
import type { ElementSize } from './useElementSize'

const readSize = (): ElementSize => ({ width: window.innerWidth, height: window.innerHeight })

/** Window size in CSS px, updated at most once per animation frame while resizing. */
export function useWindowSize(): ElementSize {
  const [size, setSize] = useState<ElementSize>(readSize)

  useEffect(() => {
    let frame = 0
    const onResize = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = readSize()
        setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return size
}
