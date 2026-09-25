import { useEffect, useEffectEvent } from 'react'
import type { AppPlatform } from '@/core/types'
import {
  assertNoConflicts,
  getShortcut,
  SHORTCUTS,
  type ShortcutId
} from '@/core/constants/shortcuts'
import { usePlatform } from './usePlatform'

if (import.meta.env.DEV) assertNoConflicts(SHORTCUTS)

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

const CODE_KEYS: Record<string, string> = {
  Equal: '=',
  Minus: '-',
  NumpadAdd: 'plus',
  NumpadSubtract: '-',
  Slash: '/',
  Tab: 'tab'
}

/** The key a physical key stands for, whatever the layout or Alt makes it type. */
function keyFromCode(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase()
  if (/^(Digit|Numpad)\d$/.test(code)) return code.slice(-1)
  return CODE_KEYS[code]
}

/**
 * Whether `event` is exactly `combo`: modifiers `mod`, `ctrl`, `shift`, `alt`
 * and one key, e.g. `mod+shift+z`, `ctrl+y`, `delete`, `n` (`plus` is `+`).
 * With a modifier the physical key counts too: Alt+B types `∫` on macOS.
 */
export function matchesCombo(event: KeyboardEvent, combo: string, isMac: boolean): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop()
  const mod = parts.includes('mod')
  const ctrl = parts.includes('ctrl') || (mod && !isMac)
  const meta = mod && isMac
  const typed = event.key === '+' ? 'plus' : event.key.toLowerCase()
  const modified = event.ctrlKey || event.metaKey || event.altKey
  return (
    (typed === key || (modified && keyFromCode(event.code) === key)) &&
    event.ctrlKey === ctrl &&
    event.metaKey === meta &&
    event.shiftKey === parts.includes('shift') &&
    event.altKey === parts.includes('alt')
  )
}

/**
 * Window-level key bindings: `{ 'mod+z': undo, delete: remove }`. The first
 * matching combo handles the key and prevents its default. App shortcuts go
 * through `useShortcuts`, which reads their combos from the registry.
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

/** Whether `event` is one of the combos of shortcut `id` (for element-level handlers). */
export function matchesShortcut(event: KeyboardEvent, id: ShortcutId, isMac: boolean): boolean {
  return getShortcut(id).keys.some((combo) => matchesCombo(event, combo, isMac))
}

export interface ShortcutOptions {
  enabled?: boolean
}

/**
 * Shortcuts from the registry (`@/core/constants/shortcuts`), by id:
 * `useShortcuts({ 'diagram.undo': undo })`. Each fires on any of its combos;
 * only those marked `whileTyping` fire in fields and the document editor.
 */
export function useShortcuts(
  handlers: Partial<Record<ShortcutId, KeyHandler>>,
  { enabled = true }: ShortcutOptions = {}
): void {
  const platform = usePlatform()
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) return
    const isMac = platform === 'darwin'
    const typing = isEditableTarget(event.target)
    for (const [id, handler] of Object.entries(handlers) as [ShortcutId, KeyHandler][]) {
      const shortcut = getShortcut(id)
      if (typing && !shortcut.whileTyping) continue
      if (!shortcut.keys.some((combo) => matchesCombo(event, combo, isMac))) continue
      event.preventDefault()
      handler(event)
      return
    }
  })

  useEffect(() => {
    if (!enabled) return
    const listener = (event: KeyboardEvent): void => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [enabled])
}

/** One registry shortcut; see `useShortcuts`. */
export function useShortcut(id: ShortcutId, handler: KeyHandler, options?: ShortcutOptions): void {
  useShortcuts({ [id]: handler }, options)
}
