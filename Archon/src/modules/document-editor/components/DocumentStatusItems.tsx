import type { EditorSlotProps } from '@/core/types'
import { StatusSegment } from '@/shared/components/layout/StatusSegment'
import { useDocumentSession } from '../store/document-editor.store'

/** „N words” in the status bar. */
export function DocumentStatusItems({ tab }: EditorSlotProps): React.JSX.Element | null {
  const words = useDocumentSession(tab.tabId)?.words
  if (words === undefined) return null
  return (
    <StatusSegment mono priority={1}>
      {words === 1 ? '1 word' : `${words} words`}
    </StatusSegment>
  )
}
