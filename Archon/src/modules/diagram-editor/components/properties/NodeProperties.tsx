import { useId } from 'react'
import { Input, Textarea, TagInput, Toggle } from '@/shared/components/ui'
import { canBeExternal, isC4, NODE_KINDS, nodeColor, nodeIcon } from '../../constants/node-kinds'
import { useCommitOnFocus } from '../../hooks/useCommitOnFocus'
import { useTagSuggestions } from '../../hooks/useTagSuggestions'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import type { FlowNode, FlowNodeData } from '../../utils/graph-mapping'
import { isFreeForm } from '../../utils/node-factory'
import { ColorField } from './ColorField'
import { DeleteButton } from './DeleteButton'
import { Field } from './Field'
import { NodeIdentity } from './NodeIdentity'

type TextKey = 'label' | 'subtitle' | 'description'

/** What the subtitle means: C4 elements keep their technology there, a boundary its kind. */
function subtitleLabel(type: FlowNode['type']): string | null {
  switch (type) {
    case 'c4-person':
    case 'c4-system':
      return null
    case 'c4-container':
    case 'c4-database':
    case 'c4-component':
      return 'Technology'
    case 'c4-boundary':
      return 'Bounds'
    default:
      return 'Subtitle'
  }
}

interface TextFieldProps {
  value: string
  onFocus: () => void
  onBlur: () => void
  onChange: (event: { target: { value: string } }) => void
}

/** One node: identity, name, subtitle, color, description, tags, retry or external, delete. */
export function NodeProperties({ node }: { node: FlowNode }): React.JSX.Element {
  const ids = {
    name: useId(),
    subtitle: useId(),
    description: useId(),
    tags: useId(),
    retry: useId(),
    external: useId()
  }
  const updateNodeData = useDiagramStore((s) => s.updateNodeData)
  const session = useCommitOnFocus(node.id)
  const suggestions = useTagSuggestions()
  const kind = NODE_KINDS[node.type ?? 'element'] ?? NODE_KINDS.element
  const freeForm = isFreeForm(node.type)
  const subtitle = freeForm ? null : subtitleLabel(node.type)
  const { data } = node
  const color = nodeColor(node.type, data.color, data.external)

  // Typing: one undo step for the whole edit of a field (see `useCommitOnFocus`).
  const text = (key: TextKey): TextFieldProps => ({
    value: data[key],
    onFocus: session.onFocus,
    onBlur: session.onBlur,
    onChange: (event: { target: { value: string } }) =>
      updateNodeData(node.id, { [key]: event.target.value }, { commit: session.takeCommit() })
  })
  // Swatches, toggle and tags: one undo step each.
  const set = (patch: Partial<FlowNodeData>): void =>
    updateNodeData(node.id, patch, { commit: true })

  return (
    <div className="flex flex-col gap-3.5">
      <NodeIdentity
        icon={nodeIcon(node.type, data.icon)}
        color={color}
        title={freeForm || isC4(node.type) ? kind.label : `${kind.label} node`}
        id={node.id}
      />

      <div className="grid grid-cols-1 gap-3.5 @min-[320px]:grid-cols-2 @min-[320px]:gap-2.5">
        <Field label={node.type === 'text' ? 'Text' : 'Name'} htmlFor={ids.name}>
          <Input id={ids.name} {...text('label')} />
        </Field>
        {subtitle && (
          <Field label={subtitle} htmlFor={ids.subtitle}>
            <Input id={ids.subtitle} tone="muted" {...text('subtitle')} />
          </Field>
        )}
      </div>

      {freeForm ? (
        <p className="text-[12px] leading-[1.6] text-fg-subtle">
          Stroke, fill and text size are in the toolbar at the top.
        </p>
      ) : (
        <>
          <ColorField value={color} onChange={(next) => set({ color: next })} />
          <Field label="Description" htmlFor={ids.description}>
            <Textarea id={ids.description} className="h-[74px]" {...text('description')} />
          </Field>
          <Field label="Tags" htmlFor={ids.tags}>
            <TagInput
              id={ids.tags}
              tags={data.tags}
              suggestions={suggestions}
              onAdd={(tag) => set({ tags: [...data.tags, tag] })}
              onRemove={(tag) => set({ tags: data.tags.filter((t) => t !== tag) })}
            />
          </Field>
        </>
      )}

      <div className="flex flex-col gap-2.5 border-t border-border pt-3">
        {kind.supportsRetry && (
          <div className="flex items-center justify-between gap-2">
            <span id={ids.retry} className="text-[12px] text-fg-muted">
              Retry on fail
            </span>
            <Toggle
              checked={data.retryOnFail}
              onChange={(retryOnFail) => set({ retryOnFail })}
              aria-labelledby={ids.retry}
            />
          </div>
        )}
        {canBeExternal(node.type) && (
          <div className="flex items-center justify-between gap-2">
            <span id={ids.external} className="text-[12px] text-fg-muted">
              External (outside the system in scope)
            </span>
            <Toggle
              checked={data.external}
              onChange={(external) => set({ external })}
              aria-labelledby={ids.external}
            />
          </div>
        )}
        <DeleteButton>{freeForm ? 'Delete shape' : 'Delete node'}</DeleteButton>
      </div>
    </div>
  )
}
