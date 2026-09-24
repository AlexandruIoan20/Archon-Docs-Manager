import { IconButton } from '@/shared/components/ui'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { cn } from '@/shared/utils/cn'
import { formatShortcut } from '@/shared/utils/platform'
import { selectCanRedo, selectCanUndo } from '../../store/diagram.store'
import { useDiagramStore } from '../../store/DiagramStoreProvider'

/** Undo / redo: text color with history, text3 without (no faded button). */
export function HistoryButtons(): React.JSX.Element {
  const platform = usePlatform()
  const canUndo = useDiagramStore(selectCanUndo)
  const canRedo = useDiagramStore(selectCanRedo)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)

  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        icon="undo"
        label={`Undo (${formatShortcut(platform, 'Z')})`}
        disabled={!canUndo}
        onClick={() => undo()}
        className={cn('disabled:opacity-100', canUndo ? 'text-fg' : 'text-fg-subtle')}
      />
      <IconButton
        icon="redo"
        label={`Redo (${formatShortcut(platform, 'Shift+Z')})`}
        disabled={!canRedo}
        onClick={() => redo()}
        className={cn('disabled:opacity-100', canRedo ? 'text-fg' : 'text-fg-subtle')}
      />
    </div>
  )
}
