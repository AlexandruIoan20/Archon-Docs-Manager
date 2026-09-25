import type { EditorSlotProps } from '@/core/types'
import { EmptyState } from '@/shared/components/ui'
import { useSelectedElements } from '../hooks/useSelectedElements'
import { selectIsMermaid } from '../store/diagram.store'
import { DiagramStoreProvider } from '../store/DiagramStoreProvider'
import { useDiagramStoreFor, useRegisteredStore } from '../store/store-registry'
import { EdgeProperties } from './properties/EdgeProperties'
import { EmptySelection } from './properties/EmptySelection'
import { MultiSelectionProperties } from './properties/MultiSelectionProperties'
import { NodeProperties } from './properties/NodeProperties'

function Content(): React.JSX.Element {
  const selected = useSelectedElements()
  switch (selected.kind) {
    case 'none':
      return <EmptySelection />
    case 'node':
      return <NodeProperties node={selected.node} />
    case 'edge':
      return <EdgeProperties edge={selected.edge} />
    case 'multiple':
      return <MultiSelectionProperties nodeIds={selected.nodeIds} edgeIds={selected.edgeIds} />
  }
}

/**
 * The diagram's inspector: edits what is selected on the canvas. The panel is
 * another slot of the shell, so the tab's store comes from the registry.
 */
export function PropertiesPanel({ tab }: EditorSlotProps): React.JSX.Element | null {
  const store = useRegisteredStore(tab.tabId)
  const mermaid = useDiagramStoreFor(tab.tabId, selectIsMermaid)
  if (!store) return null
  if (mermaid) {
    return (
      <EmptyState className="px-4 py-6">
        This diagram is Mermaid text.
        <br />
        Edit it in the source pane; the preview follows.
      </EmptyState>
    )
  }
  return (
    <DiagramStoreProvider store={store}>
      {/* The container of the NAME | SUBTITLE columns above 320px. */}
      <div className="@container p-3">
        <Content />
      </div>
    </DiagramStoreProvider>
  )
}
