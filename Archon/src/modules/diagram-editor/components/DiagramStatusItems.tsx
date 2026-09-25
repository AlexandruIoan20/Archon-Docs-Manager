import type { EditorSlotProps } from '@/core/types'
import { StatusSegment } from '@/shared/components/layout/StatusSegment'
import {
  selectCounts,
  selectIsMermaid,
  selectMermaidLines,
  selectSelectionId,
  selectZoomPercent,
  type DiagramState
} from '../store/diagram.store'
import { useDiagramStoreFor } from '../store/store-registry'

const selectPreviewZoom = (state: DiagramState): number => Math.round(state.previewZoom * 100)

/**
 * „N nodes · M edges”, „Selection: N2”, and the canvas zoom; for a Mermaid
 * diagram, „Mermaid · N lines” and the preview zoom.
 */
export function DiagramStatusItems({ tab }: EditorSlotProps): React.JSX.Element | null {
  const mermaid = useDiagramStoreFor(tab.tabId, selectIsMermaid)
  const counts = useDiagramStoreFor(tab.tabId, selectCounts)
  const selection = useDiagramStoreFor(tab.tabId, selectSelectionId)
  const zoom = useDiagramStoreFor(tab.tabId, selectZoomPercent)
  const lines = useDiagramStoreFor(tab.tabId, selectMermaidLines)
  const previewZoom = useDiagramStoreFor(tab.tabId, selectPreviewZoom)
  if (counts === undefined || zoom === undefined) return null

  if (mermaid) {
    return (
      <>
        <StatusSegment mono priority={1}>
          {lines}
        </StatusSegment>
        <StatusSegment mono>{previewZoom}%</StatusSegment>
      </>
    )
  }

  return (
    <>
      <StatusSegment mono priority={1}>
        {counts}
      </StatusSegment>
      <StatusSegment priority={2}>Selection: {selection ?? '—'}</StatusSegment>
      <StatusSegment mono>{zoom}%</StatusSegment>
    </>
  )
}
