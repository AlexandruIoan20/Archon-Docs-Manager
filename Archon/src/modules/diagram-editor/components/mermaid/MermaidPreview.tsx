import { useEffect, useRef } from 'react'
import { EmptyState } from '@/shared/components/ui'
import type { MermaidRender } from '../../hooks/useMermaidRender'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import { clampZoom, stepZoom } from '../../utils/zoom'
import { ZoomBar } from '../canvas/ZoomBar'
import { MermaidError } from './MermaidError'
import '../../styles/mermaid.css'

export interface MermaidPreviewProps {
  render: MermaidRender
  /** Narrow: the error pill moves up, clear of the zoom bar. */
  narrow?: boolean
}

/** The rendered SVG, centred on the dot grid; Ctrl/⌘ + wheel or the zoom bar zoom it. */
export function MermaidPreview({ render, narrow = false }: MermaidPreviewProps): React.JSX.Element {
  const zoom = useDiagramStore((s) => s.previewZoom)
  const setZoom = useDiagramStore((s) => s.setPreviewZoom)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Not a React handler: those are passive, and the page must not zoom too.
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setZoom(clampZoom(stepZoom(zoom, event.deltaY < 0 ? 1 : -1)))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [zoom, setZoom])

  return (
    <div className="mermaid-preview relative flex min-h-0 min-w-0 flex-1">
      <div ref={scrollRef} data-testid="mermaid-preview" className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full min-w-full items-center justify-center p-8">
          {render.svg ? (
            <div
              // Mermaid output at `securityLevel: 'strict'` is sanitised.
              dangerouslySetInnerHTML={{ __html: render.svg }}
              style={{ zoom }}
            />
          ) : (
            <EmptyState>{render.loading ? 'Rendering…' : 'Nothing to preview yet.'}</EmptyState>
          )}
        </div>
      </div>
      <ZoomBar zoom={zoom} onZoom={setZoom} />
      <MermaidError error={render.error} raised={narrow} />
    </div>
  )
}
