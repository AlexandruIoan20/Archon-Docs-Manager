import { useEditorStore } from '@/store'
import { useShortcuts } from '@/shared/hooks/useKeyboard'
import { cycleTab, requestClose } from './useEditorTabs'

/** `Ctrl/Cmd+W` closes the active tab; `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle. */
export function useTabShortcuts(): void {
  useShortcuts({
    'tab.close': () => {
      const { activeId } = useEditorStore.getState()
      if (activeId) void requestClose([activeId])
    },
    'tab.next': () => cycleTab(1),
    'tab.previous': () => cycleTab(-1)
  })
}
