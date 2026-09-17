import type { ReactNode } from 'react'
import type { PanelState } from '@/core/types'
import { useUiStore } from '@/store'
import { usePanelResize } from '@/shared/hooks/usePanelResize'
import { SidePanel } from './SidePanel'

export interface SidebarProps {
  panel: PanelState
  children?: ReactNode
}

/** Left panel frame; the workspace module fills it (plan 08). */
export function Sidebar({ panel, children }: SidebarProps): React.JSX.Element {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const resize = usePanelResize('sidebar')

  return (
    <SidePanel
      mode={panel.mode}
      width={panel.width}
      side="start"
      label="Sidebar"
      onClose={() => closeOverlay('sidebar')}
      resize={resize}
      className="border-r border-border bg-side"
    >
      {children}
    </SidePanel>
  )
}
