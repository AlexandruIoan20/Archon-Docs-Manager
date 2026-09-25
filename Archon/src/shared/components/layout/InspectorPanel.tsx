import type { ReactNode } from 'react'
import type { PanelState } from '@/core/types'
import { useUiStore } from '@/store'
import { IconButton } from '@/shared/components/ui'
import { usePanelResize } from '@/shared/hooks/usePanelResize'
import { SidePanel } from './SidePanel'

export interface InspectorPanelProps {
  panel: PanelState
  title?: string
  children?: ReactNode
}

/** Right panel frame; the active editor's `Inspector` fills it. */
export function InspectorPanel({
  panel,
  title = 'Properties',
  children
}: InspectorPanelProps): React.JSX.Element {
  const togglePanel = useUiStore((s) => s.togglePanel)
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const resize = usePanelResize('inspector')

  return (
    <SidePanel
      mode={panel.mode}
      width={panel.width}
      side="end"
      label="Inspector"
      onClose={() => closeOverlay('inspector')}
      resize={resize}
      className="border-l border-border bg-surface"
    >
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-3.5">
        <h2 className="truncate text-[12px] font-semibold tracking-[0.4px] text-fg">{title}</h2>
        <IconButton
          icon="close"
          label="Close properties"
          shortcut="panel.inspector"
          size="sm"
          onClick={() => togglePanel('inspector', !panel.fits)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </SidePanel>
  )
}
