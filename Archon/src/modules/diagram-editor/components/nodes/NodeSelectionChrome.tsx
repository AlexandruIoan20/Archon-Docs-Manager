import { Icon } from '@/shared/components/icons'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'

const GRIPS = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'] as const

/** Ring, six grips, the id badge and the delete button around a selected node. */
export function NodeSelectionChrome({ id }: { id: string }): React.JSX.Element {
  const store = useDiagramStoreApi()
  return (
    <>
      <div aria-hidden className="soar-node-ring" />
      {GRIPS.map((grip) => (
        <span key={grip} aria-hidden className={`soar-node-grip soar-node-grip--${grip}`} />
      ))}
      <div className="soar-node-toolbar nodrag nopan">
        <span className="soar-node-badge">{id}</span>
        <button
          type="button"
          aria-label={`Delete ${id}`}
          className="soar-node-delete"
          onClick={(event) => {
            event.stopPropagation()
            store.getState().removeNodes([id])
          }}
        >
          <Icon name="trash" size={11} />
        </button>
      </div>
    </>
  )
}
