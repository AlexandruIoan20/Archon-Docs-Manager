import { useUiStore } from '@/store'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { useKeyboard, type KeyHandler } from '@/shared/hooks/useKeyboard'
import { formatShortcut } from '@/shared/utils/platform'
import { TOOLS } from '../constants/tools'
import type { DiagramStoreApi } from '../store/diagram.store'

function deletedMessage(nodes: number, edges: number): string {
  if (nodes > 1) return `${nodes} nodes deleted`
  if (nodes === 1) return 'Node deleted'
  return edges > 1 ? `${edges} edges deleted` : 'Edge deleted'
}

/**
 * Canvas shortcuts. Mounted with the diagram editor, so they only act on the
 * active diagram tab, and never while typing in a field.
 */
export function useDiagramShortcuts(store: DiagramStoreApi | null): void {
  const platform = usePlatform()
  const notify = (message: string): void => useUiStore.getState().notify(message)

  const remove: KeyHandler = () => {
    if (!store) return
    const { nodes, edges } = store.getState().deleteSelection()
    if (nodes + edges === 0) return
    notify(`${deletedMessage(nodes, edges)} — ${formatShortcut(platform, 'Z')} to undo`)
  }
  const undo: KeyHandler = () => {
    if (store && !store.getState().undo()) notify('Nothing to undo')
  }
  const redo: KeyHandler = () => {
    if (store && !store.getState().redo()) notify('Nothing to redo')
  }

  const bindings: Record<string, KeyHandler> = {
    delete: remove,
    backspace: remove,
    'mod+z': undo,
    'mod+shift+z': redo,
    'ctrl+y': redo,
    escape: () => store?.getState().setConnectFrom(null)
  }
  for (const tool of TOOLS) {
    bindings[tool.shortcut.toLowerCase()] = () => store?.getState().setTool(tool.id)
  }

  useKeyboard(bindings, { enabled: store !== null, platform })
}
