import type { EditorSlotProps } from '@/core/types'
import { Divider } from '@/shared/components/ui'
import { useTitleBarDensity } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { DiagramStoreProvider } from '../../store/DiagramStoreProvider'
import { selectIsMermaid } from '../../store/diagram.store'
import { useDiagramStoreFor, useRegisteredStore } from '../../store/store-registry'
import { NodePalette } from '../NodePalette'
import { HistoryButtons } from './HistoryButtons'
import { StyleControls } from './StyleControls'
import { StylePopover } from './StylePopover'

function Tools(): React.JSX.Element {
  const density = useTitleBarDensity()
  return (
    <div className="flex items-center gap-2">
      <NodePalette minimal={density === 'minimal'} />
      <Divider />
      {density === 'full' ? <StyleControls layout="inline" /> : <StylePopover />}
      <Divider />
      <HistoryButtons />
    </div>
  )
}

/**
 * The diagram's title bar tools: palette │ style │ undo/redo. The title bar is
 * another slot of the shell, so the tab's store comes from the registry.
 * A Mermaid diagram has none: its text area keeps its own undo/redo.
 */
export function DiagramToolbar({ tab }: EditorSlotProps): React.JSX.Element | null {
  const store = useRegisteredStore(tab.tabId)
  const mermaid = useDiagramStoreFor(tab.tabId, selectIsMermaid)
  if (!store || mermaid) return null
  return (
    <DiagramStoreProvider store={store}>
      <Tools />
    </DiagramStoreProvider>
  )
}
