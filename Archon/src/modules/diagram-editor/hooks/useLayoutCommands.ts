import { useMemo } from 'react'
import { useUiStore } from '@/store'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { formatShortcut } from '@/shared/utils/platform'
import type { DiagramStoreApi } from '../store/diagram.store'
import type { AlignMode, DistributeAxis } from '../utils/align'
import type { LayoutDirection } from '../utils/auto-layout'

export interface LayoutCommands {
  align: (mode: AlignMode) => void
  distribute: (axis: DistributeAxis) => void
  arrange: (direction: LayoutDirection) => void
}

/** Align, distribute and arrange with their toasts: shortcuts, panel, menus and toolbar. */
export function useLayoutCommands(store: DiagramStoreApi | null): LayoutCommands {
  const platform = usePlatform()
  return useMemo(() => {
    const notify = (message: string): void => useUiStore.getState().notify(message)
    const selected = (): number => store?.getState().nodes.filter((n) => n.selected).length ?? 0
    return {
      align: (mode) => {
        if (!store) return
        if (selected() < 2) return notify('Select two or more nodes to align')
        store.getState().alignSelection(mode)
      },
      distribute: (axis) => {
        if (!store) return
        if (selected() < 3) return notify('Select three or more nodes to distribute')
        store.getState().distributeSelection(axis)
      },
      arrange: (direction) => {
        if (!store) return
        const scope = selected() > 1 ? 'Selection' : 'Diagram'
        if (!store.getState().arrange(direction)) return notify('Nothing to arrange')
        notify(`${scope} arranged — ${formatShortcut(platform, 'Z')} to undo`)
      }
    }
  }, [store, platform])
}
