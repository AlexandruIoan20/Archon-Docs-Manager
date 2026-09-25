import { useSyncExternalStore } from 'react'

/** Theme and accent as applied to `<html>` (`data-theme`, the `--accent` override). */
function snapshot(): string {
  const root = document.documentElement
  return `${root.dataset.theme ?? ''}|${root.style.getPropertyValue('--accent')}`
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'style']
  })
  return () => observer.disconnect()
}

/**
 * Changes whenever the applied theme or accent does. The module reads the
 * document rather than the settings, so it needs nothing from the shell.
 */
export function useThemeKey(): string {
  return useSyncExternalStore(subscribe, snapshot)
}
