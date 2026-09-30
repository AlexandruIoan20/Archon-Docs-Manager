import type { ShortcutId } from '@/core/constants/shortcuts'
import { useUiStore } from '@/store'
import { useShortcuts, type KeyHandler } from '@/shared/hooks/useKeyboard'
import { ALIGN_COMMANDS, ARRANGE_COMMANDS, DISTRIBUTE_COMMANDS } from '../constants/layout-commands'
import { TOOLS } from '../constants/tools'
import type { DiagramStoreApi } from '../store/diagram.store'
import { useDeleteSelection } from './useDeleteSelection'
import { useLayoutCommands } from './useLayoutCommands'
import { useNodeClipboard } from './useNodeClipboard'

/**
 * Canvas shortcuts (the registry's `diagram` scope). Mounted with the diagram
 * editor, so they only act on the active diagram tab, and never while typing.
 */
export function useDiagramShortcuts(store: DiagramStoreApi | null): void {
  const notify = (message: string): void => useUiStore.getState().notify(message)
  const remove = useDeleteSelection(store)
  const clipboard = useNodeClipboard(store)
  const layout = useLayoutCommands(store)

  const handlers: Partial<Record<ShortcutId, KeyHandler>> = {
    'diagram.delete': remove,
    'diagram.undo': () => {
      if (store && !store.getState().undo()) notify('Nothing to undo')
    },
    'diagram.redo': () => {
      if (store && !store.getState().redo()) notify('Nothing to redo')
    },
    'diagram.copy': () => void clipboard.copy(),
    'diagram.paste': () => void clipboard.paste(),
    'diagram.duplicate': () => clipboard.duplicate(),
    'diagram.cancel': () => store?.getState().setConnectFrom(null)
  }
  for (const tool of TOOLS) {
    handlers[tool.shortcutId] = () => store?.getState().setTool(tool.id)
  }
  for (const { shortcut, value } of ALIGN_COMMANDS) {
    if (shortcut) handlers[shortcut] = () => layout.align(value)
  }
  for (const { shortcut, value } of DISTRIBUTE_COMMANDS) {
    if (shortcut) handlers[shortcut] = () => layout.distribute(value)
  }
  for (const { shortcut, value } of ARRANGE_COMMANDS) {
    if (shortcut) handlers[shortcut] = () => layout.arrange(value)
  }

  useShortcuts(handlers, { enabled: store !== null })
}
