import { useRef, useState } from 'react'
import { IconButton, Menu, MenuItem } from '@/shared/components/ui'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { shortcutLabel } from '@/shared/utils/platform'
import { ARRANGE_COMMANDS } from '../../constants/layout-commands'
import { useLayoutCommands } from '../../hooks/useLayoutCommands'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'

/** Arrange ▾: lays the diagram (or the selection) out top to bottom or left to right. */
export function ArrangeMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const layout = useLayoutCommands(useDiagramStoreApi())
  const platform = usePlatform()

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon="hierarchy"
        label="Arrange"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      <Menu open={open} onClose={() => setOpen(false)} anchor={anchorRef} aria-label="Arrange">
        {ARRANGE_COMMANDS.map((command) => (
          <MenuItem
            key={command.value}
            icon={command.icon}
            suffix={command.shortcut ? shortcutLabel(platform, command.shortcut) : undefined}
            onSelect={() => layout.arrange(command.value)}
          >
            {command.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
