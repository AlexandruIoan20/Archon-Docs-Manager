import type { DiagramEngine } from '@/core/types'
import { Button, Kbd, SegmentedControl } from '@/shared/components/ui'
import type { DiagramCatalogEntry } from '../../constants/diagram-catalog'
import { DestinationPicker } from './DestinationPicker'

export interface DialogFooterProps {
  selected: DiagramCatalogEntry | null
  folder: string
  onFolderChange: (folder: string) => void
  engine: DiagramEngine
  onEngineChange: (engine: DiagramEngine) => void
  /** The selected type can be a Mermaid text diagram. */
  textSupported: boolean
  onCancel: () => void
  onCreate: () => void
  creating: boolean
}

/** Selected type, destination, Cancel / Create. Below 720px: two rows. */
export function DialogFooter({
  selected,
  folder,
  onFolderChange,
  engine,
  onEngineChange,
  textSupported,
  onCancel,
  onCreate,
  creating
}: DialogFooterProps): React.JSX.Element {
  return (
    <footer className="flex min-h-14 shrink-0 flex-wrap items-center gap-3 border-t border-border bg-side px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3 @max-[719.98px]/modal:basis-full">
        <span className="shrink-0 text-[11px] text-fg-muted">Selected</span>
        <span className="inline-flex h-[22px] shrink-0 items-center rounded-sm bg-accent-soft px-2 text-[11px] font-medium text-accent-fg">
          {selected ? `${selected.name} diagram` : '—'}
        </span>
        <SegmentedControl
          variant="pills"
          aria-label="Editor"
          value={engine}
          onChange={onEngineChange}
          className="shrink-0"
          options={[
            { value: 'react-flow', label: 'Canvas' },
            {
              value: 'mermaid',
              label: 'Text',
              disabled: !textSupported,
              tooltip: textSupported
                ? 'Mermaid text with a live preview'
                : 'Canvas only for this type'
            }
          ]}
        />
        <DestinationPicker value={folder} onChange={onFolderChange} />
      </div>
      <div className="ml-auto flex shrink-0 gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onCreate} disabled={!selected || creating}>
          Create diagram <Kbd>⏎</Kbd>
        </Button>
      </div>
    </footer>
  )
}
