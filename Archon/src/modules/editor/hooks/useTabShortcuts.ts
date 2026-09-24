import { useEffect } from 'react'
import { useEditorStore } from '@/store'
import { cycleTab, requestClose } from './useEditorTabs'

/**
 * `Ctrl/Cmd+W` closes the active tab; `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle.
 * They move to the shortcut registry in plan 20.
 */
export function useTabShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Tab' && event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault()
        cycleTab(event.shiftKey ? -1 : 1)
        return
      }
      const mod = event.ctrlKey || event.metaKey
      if (!mod || event.shiftKey || event.altKey || event.code !== 'KeyW') return
      event.preventDefault()
      const { activeId } = useEditorStore.getState()
      if (activeId) void requestClose([activeId])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
