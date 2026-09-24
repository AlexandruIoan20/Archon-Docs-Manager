import { useEffect, useEffectEvent } from 'react'
import type { AppPlatform } from '@/core/types'

export type KeyHandler = (event: KeyboardEvent) => void

export interface KeyboardOptions {
  enabled?: boolean
  /** Skip keys typed in inputs, textareas and rich-text editors (default). */
  ignoreEditable?: boolean
  /** `mod` is Cmd on macOS and Ctrl elsewhere. */
  platform?: AppPlatform
}

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

export function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITABLE) !== null
}

/**
 * Whether `event` is exactly `combo`: modifiers `mod`, `ctrl`, `shift`, `alt`
 * and one key, e.g. `mod+shift+z`, `ctrl+y`, `delete`, `n`.
 */
export function matchesCombo(event: KeyboardEvent, combo: string, isMac: boolean): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop()
  const mod = parts.includes('mod')
  const ctrl = parts.includes('ctrl') || (mod && !isMac)
  const meta = mod && isMac
  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === ctrl &&
    event.metaKey === meta &&
    event.shiftKey === parts.includes('shift') &&
    event.altKey === parts.includes('alt')
  )
}

/**
 * Window-level shortcuts: `{ 'mod+z': undo, delete: remove }`. The first
 * matching combo handles the key and prevents its default. Plan 20 grows this
 * into a registry.
 */
export function useKeyboard(
  bindings: Record<string, KeyHandler>,
  { enabled = true, ignoreEditable = true, platform }: KeyboardOptions = {}
): void {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) return
    if (ignoreEditable && isEditableTarget(event.target)) return
    const isMac = platform === 'darwin'
    const combo = Object.keys(bindings).find((c) => matchesCombo(event, c, isMac))
    if (!combo) return
    event.preventDefault()
    bindings[combo]?.(event)
  })

  useEffect(() => {
    if (!enabled) return
    const listener = (event: KeyboardEvent): void => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [enabled])
}
