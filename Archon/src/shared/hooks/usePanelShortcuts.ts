import { useEffect, useEffectEvent } from 'react'
import type { PanelLayout } from '@/core/types'
import { useUiStore } from '@/store'

/**
 * `Ctrl/Cmd+B` toggles the sidebar, `Ctrl/Cmd+Alt+B` the inspector. They move
 * to the shortcut registry in plan 20 (zoom lives in `useUiZoom`).
 */
export function usePanelShortcuts(layout: PanelLayout): void {
  const togglePanel = useUiStore((s) => s.togglePanel)

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const mod = event.ctrlKey || event.metaKey
    // `code`, not `key`: Alt changes the produced character on macOS.
    if (!mod || event.shiftKey || event.code !== 'KeyB') return
    event.preventDefault()
    const id = event.altKey ? 'inspector' : 'sidebar'
    togglePanel(id, !layout[id].fits)
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
}
