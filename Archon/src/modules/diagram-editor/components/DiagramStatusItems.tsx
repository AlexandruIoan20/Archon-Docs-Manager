import type { EditorSlotProps } from '@/core/types'
import { StatusSegment } from '@/shared/components/layout/StatusSegment'
import { selectCounts, selectSelectionId, selectZoomPercent } from '../store/diagram.store'
import { useDiagramStoreFor } from '../store/store-registry'

/** „N nodes · M edges”, „Selection: N2”, and the canvas zoom. */
export function DiagramStatusItems({ tab }: EditorSlotProps): React.JSX.Element | null {
  const counts = useDiagramStoreFor(tab.tabId, selectCounts)
  const selection = useDiagramStoreFor(tab.tabId, selectSelectionId)
  const zoom = useDiagramStoreFor(tab.tabId, selectZoomPercent)
  if (counts === undefined || zoom === undefined) return null

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
