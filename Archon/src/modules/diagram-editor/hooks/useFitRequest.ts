import { useEffect, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDiagramStore } from '../store/DiagramStoreProvider'

/**
 * Fits the view to the nodes when the store asks (`fitRequest`, bumped by
 * Arrange), after React Flow has placed them. Not a pan by the user: the
 * viewport is not saved for it.
 */
export function useFitRequest(): void {
  const request = useDiagramStore((s) => s.fitRequest)
  const handled = useRef(request)
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (request === handled.current) return
    handled.current = request
    const frame = requestAnimationFrame(() => void fitView({ padding: 0.12, duration: 200 }))
    return () => cancelAnimationFrame(frame)
  }, [request, fitView])
}
