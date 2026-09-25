import { useId } from 'react'
import { Input } from '@/shared/components/ui'
import { NODE_COLORS } from '../../constants/node-palette'
import { useCommitOnFocus } from '../../hooks/useCommitOnFocus'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import type { FlowEdge } from '../../utils/graph-mapping'
import { DeleteButton } from './DeleteButton'
import { Field } from './Field'
import { NodeIdentity } from './NodeIdentity'

/** One edge: its label (e.g. „score ≥ 70”) and Delete. */
export function EdgeProperties({ edge }: { edge: FlowEdge }): React.JSX.Element {
  const labelId = useId()
  const setEdgeLabel = useDiagramStore((s) => s.setEdgeLabel)
  const session = useCommitOnFocus(edge.id)

  return (
    <div className="flex flex-col gap-3.5">
      <NodeIdentity
        icon="flow"
        color={NODE_COLORS.neutral}
        title={`Edge · ${edge.source} → ${edge.target}`}
        id={edge.id}
      />
      <Field label="Label" htmlFor={labelId}>
        <Input
          id={labelId}
          value={typeof edge.label === 'string' ? edge.label : ''}
          placeholder="e.g. score ≥ 70"
          onFocus={session.onFocus}
          onBlur={session.onBlur}
          onChange={(event) =>
            setEdgeLabel(edge.id, event.target.value, { commit: session.takeCommit() })
          }
        />
      </Field>
      <div className="border-t border-border pt-3">
        <DeleteButton>Delete edge</DeleteButton>
      </div>
    </div>
  )
}
