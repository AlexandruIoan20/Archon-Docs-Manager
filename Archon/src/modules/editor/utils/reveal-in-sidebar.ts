import { parentPath } from '@/core/utils/rel-path'
import { useUiStore, useWorkspaceStore } from '@/store'

/** Shows `relPath` in the file tree: its folders expanded, the sidebar open, the row in view. */
export function revealInSidebar(relPath: string): void {
  const workspace = useWorkspaceStore.getState()
  workspace.setSideTab('files')
  workspace.setQuery('')
  for (let folder = parentPath(relPath); folder !== ''; folder = parentPath(folder)) {
    workspace.setExpanded(folder, true)
  }
  const ui = useUiStore.getState()
  if (!ui.panels.sidebar.visible) ui.togglePanel('sidebar', false)
  requestAnimationFrame(() => {
    const row = document.querySelector<HTMLElement>(`[data-path="${CSS.escape(relPath)}"]`)
    row?.scrollIntoView?.({ block: 'nearest' })
    row?.focus()
  })
}
