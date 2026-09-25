import { useRef, useState } from 'react'
import type { EditorSlotProps } from '@/core/types'
import { useTitleBarDensity } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { Button, IconButton, Menu, MenuItem } from '@/shared/components/ui'
import { EXPORT_FORMATS } from '../../export/export-formats'
import { useExportDiagram } from '../../hooks/useExportDiagram'
import { useDiagramStoreFor } from '../../store/store-registry'

/** „Export” in the title bar and its menu of formats (the `TitleActions` slot). */
export function ExportMenu({ tab }: EditorSlotProps): React.JSX.Element | null {
  const density = useTitleBarDensity()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const { run, busy } = useExportDiagram(tab)
  const type = useDiagramStoreFor(tab.tabId, (s) => s.meta.type)
  const engine = useDiagramStoreFor(tab.tabId, (s) => s.meta.engine)
  if (type === undefined || engine === undefined) return null

  const trigger = {
    ref: anchorRef,
    disabled: busy,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    onClick: () => setOpen((value) => !value)
  }

  return (
    <>
      {density === 'minimal' ? (
        <IconButton {...trigger} icon="download" label="Export" variant="outline" />
      ) : (
        <Button {...trigger} variant="outline-accent" icon="download">
          Export
        </Button>
      )}
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchor={anchorRef}
        placement="bottom-end"
        width={190}
        aria-label="Export as"
        className="rounded-lg p-[5px]"
      >
        {EXPORT_FORMATS.map((format) => {
          const available = format.isAvailable({ type, engine })
          return (
            <MenuItem
              key={format.id}
              suffix={format.extension}
              disabled={!available}
              title={available ? undefined : 'Not available for this diagram type'}
              onSelect={() => void run(format)}
            >
              {format.label}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
