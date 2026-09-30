import { useId } from 'react'
import { IconButton } from '@/shared/components/ui'
import { ALIGN_COMMANDS, DISTRIBUTE_COMMANDS } from '../../constants/layout-commands'
import { useLayoutCommands } from '../../hooks/useLayoutCommands'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'
import { Field } from './Field'

/** Align two or more selected nodes; distribute three or more. */
export function AlignField({ nodeCount }: { nodeCount: number }): React.JSX.Element {
  const labelId = useId()
  const layout = useLayoutCommands(useDiagramStoreApi())

  return (
    <Field label="Align" labelId={labelId}>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-0.5">
        {ALIGN_COMMANDS.map((command) => (
          <IconButton
            key={command.value}
            icon={command.icon}
            label={command.label}
            shortcut={command.shortcut}
            onClick={() => layout.align(command.value)}
          />
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
        {DISTRIBUTE_COMMANDS.map((command) => (
          <IconButton
            key={command.value}
            icon={command.icon}
            label={command.label}
            shortcut={command.shortcut}
            disabled={nodeCount < 3}
            onClick={() => layout.distribute(command.value)}
          />
        ))}
      </div>
    </Field>
  )
}
