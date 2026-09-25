import { useShallow } from 'zustand/react/shallow'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import { nodeColor } from '../../constants/node-kinds'
import { isFreeForm } from '../../utils/node-factory'
import { ColorField } from './ColorField'
import { DeleteButton } from './DeleteButton'

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`

export interface MultiSelectionPropertiesProps {
  nodeIds: string[]
  edgeIds: string[]
}

/** Several elements: one color for all the nodes, and Delete. */
export function MultiSelectionProperties({
  nodeIds,
  edgeIds
}: MultiSelectionPropertiesProps): React.JSX.Element {
  const updateNodesData = useDiagramStore((s) => s.updateNodesData)
  // SOAR nodes take a semantic color; shapes and text are styled from the toolbar.
  const colorable = useDiagramStore(
    useShallow((s) => s.nodes.filter((n) => n.selected && !isFreeForm(n.type)).map((n) => n.id))
  )
  const sharedColor = useDiagramStore((s) => {
    const colors = new Set(
      s.nodes
        .filter((n) => n.selected && !isFreeForm(n.type))
        .map((n) => nodeColor(n.type, n.data.color).toLowerCase())
    )
    return colors.size === 1 ? ([...colors][0] ?? null) : null
  })

  const summary =
    edgeIds.length === 0
      ? `${plural(nodeIds.length, 'node')} selected`
      : nodeIds.length === 0
        ? `${plural(edgeIds.length, 'edge')} selected`
        : `${plural(nodeIds.length, 'node')}, ${plural(edgeIds.length, 'edge')} selected`
  const deleteLabel =
    edgeIds.length === 0
      ? `Delete ${plural(nodeIds.length, 'node')}`
      : nodeIds.length === 0
        ? `Delete ${plural(edgeIds.length, 'edge')}`
        : 'Delete selection'

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[12px] text-fg-muted">{summary}</p>
      {colorable.length > 0 && (
        <ColorField
          value={sharedColor}
          onChange={(color) => updateNodesData(colorable, { color })}
        />
      )}
      <div className="border-t border-border pt-3">
        <DeleteButton>{deleteLabel}</DeleteButton>
      </div>
    </div>
  )
}
