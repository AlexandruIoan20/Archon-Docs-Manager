import type { EditorTab } from '@/store'
import type { ContextMenuEntry } from '@/shared/components/ui'

export interface TabMenuActions {
  close: (ids: string[]) => void
  revealInSidebar: (tab: EditorTab) => void
  copyPath: (tab: EditorTab) => void
}

/** The right-click menu of a tab. Closing goes through the unsaved-changes guard. */
export function tabMenuItems(
  tab: EditorTab,
  tabs: readonly EditorTab[],
  actions: TabMenuActions
): ContextMenuEntry[] {
  const index = tabs.findIndex((t) => t.id === tab.id)
  const others = tabs.filter((t) => t.id !== tab.id).map((t) => t.id)
  const right = tabs.slice(index + 1).map((t) => t.id)
  return [
    { label: 'Close', onSelect: () => actions.close([tab.id]) },
    { label: 'Close others', disabled: others.length === 0, onSelect: () => actions.close(others) },
    {
      label: 'Close to the right',
      disabled: right.length === 0,
      onSelect: () => actions.close(right)
    },
    { type: 'separator' },
    { label: 'Reveal in sidebar', onSelect: () => actions.revealInSidebar(tab) },
    { label: 'Copy path', onSelect: () => actions.copyPath(tab) }
  ]
}
