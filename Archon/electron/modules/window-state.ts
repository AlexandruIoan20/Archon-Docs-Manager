import type { BrowserWindow } from 'electron'
import type { WindowSettings } from '@/core/types'
import type { SettingsStore } from './settings'

const SAVE_DELAY_MS = 500

function snapshot(window: BrowserWindow): WindowSettings {
  // Normal bounds are the restored size, so a maximized window still remembers it.
  return { bounds: window.getNormalBounds(), maximized: window.isMaximized() }
}

/**
 * Remembers where the window was: debounced while it moves or resizes,
 * immediately (and synchronously) when it closes.
 */
export function trackWindowState(window: BrowserWindow, store: SettingsStore): void {
  let timer: NodeJS.Timeout | undefined

  const save = (): void => {
    timer = undefined
    if (window.isDestroyed() || window.isMinimized() || window.isFullScreen()) return
    void store.update({ window: snapshot(window) }).catch(() => {
      // Already logged by the store; the next move retries.
    })
  }

  const scheduleSave = (): void => {
    clearTimeout(timer)
    timer = setTimeout(save, SAVE_DELAY_MS)
  }

  for (const event of ['resize', 'move', 'maximize', 'unmaximize'] as const) {
    window.on(event as 'resize', scheduleSave)
  }

  window.on('close', () => {
    clearTimeout(timer)
    if (window.isFullScreen()) return
    try {
      store.updateSync({ window: snapshot(window) })
    } catch (error) {
      console.error('[window-state] could not save window state', error)
    }
  })
}
