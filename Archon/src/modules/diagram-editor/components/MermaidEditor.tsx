import { useState } from 'react'
import { PanelResizeHandle } from '@/shared/components/layout/PanelResizeHandle'
import { SegmentedControl } from '@/shared/components/ui'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { useMermaidRender } from '../hooks/useMermaidRender'
import { useDiagramStore } from '../store/DiagramStoreProvider'
import { SPLIT_RATIO } from '../store/mermaid.store'
import { mermaidLayout } from '../utils/mermaid-layout'
import { MermaidError } from './mermaid/MermaidError'
import { MermaidPreview } from './mermaid/MermaidPreview'
import { MermaidSourcePane } from './mermaid/MermaidSourcePane'

type Pane = 'source' | 'preview'

const PANES = [
  { value: 'source', label: 'Source' },
  { value: 'preview', label: 'Preview' }
] as const

/** A text diagram: its Mermaid source and the live preview, split and resizable. */
export function MermaidEditor(): React.JSX.Element {
  const source = useDiagramStore((s) => s.meta.mermaidSource ?? '')
  const setSource = useDiagramStore((s) => s.setMermaidSource)
  const ratio = useDiagramStore((s) => s.splitRatio)
  const setRatio = useDiagramStore((s) => s.setSplitRatio)
  const render = useMermaidRender(source)
  const [sizeRef, { width, height }] = useElementSize<HTMLDivElement>()
  const [pane, setPane] = useState<Pane>('source')
  const layout = mermaidLayout(width)
  const row = layout === 'row'

  const sourcePane = (
    <MermaidSourcePane value={source} onChange={setSource} errorLine={render.error?.line ?? null} />
  )

  if (layout === 'single') {
    return (
      <div ref={sizeRef} className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
        <div className="shrink-0 border-b border-border bg-side p-1.5">
          <SegmentedControl aria-label="Pane" value={pane} onChange={setPane} options={PANES} />
        </div>
        {pane === 'source' ? (
          <div className="relative flex min-h-0 flex-1">
            {sourcePane}
            <MermaidError error={render.error} />
          </div>
        ) : (
          <MermaidPreview render={render} narrow />
        )}
      </div>
    )
  }

  const size = row ? width : height
  return (
    <div
      ref={sizeRef}
      data-layout={layout}
      className={`flex min-h-0 min-w-0 flex-1 bg-canvas ${row ? 'flex-row' : 'flex-col'}`}
    >
      <div
        className={`relative flex shrink-0 ${row ? 'border-r' : 'border-b'} border-border`}
        style={row ? { width: `${ratio}%` } : { height: `${ratio}%` }}
      >
        {sourcePane}
        <PanelResizeHandle
          edge="end"
          orientation={row ? 'vertical' : 'horizontal'}
          label="Resize source and preview"
          value={ratio}
          min={SPLIT_RATIO.min}
          max={SPLIT_RATIO.max}
          step={2}
          scale={size > 0 ? 100 / size : 0}
          onChange={setRatio}
          onReset={() => setRatio(SPLIT_RATIO.default)}
        />
      </div>
      <MermaidPreview render={render} narrow={!row} />
    </div>
  )
}
