/**
 * Every keyboard shortcut of the app: the one source for the handlers
 * (`useShortcuts`), the tooltips and the help screen (Ctrl/Cmd+/).
 *
 * A combo is `mod+shift+z`-like: modifiers `mod` (Cmd on macOS, Ctrl
 * elsewhere), `ctrl`, `shift`, `alt`, then one key (`plus` stands for `+`).
 */
export type ShortcutScope = 'global' | 'tree' | 'diagram' | 'document'

export interface ShortcutDef {
  id: string
  /** The first combo is the one shown; the others are alternatives. */
  keys: readonly string[]
  scope: ShortcutScope
  description: string
  /** Also while typing in a field or the document editor. */
  whileTyping?: boolean
  /** Handled by an editor of its own (TipTap, the text area): listed only. */
  listedOnly?: boolean
}

export const SHORTCUT_SCOPES: readonly { id: ShortcutScope; label: string }[] = [
  { id: 'global', label: 'General' },
  { id: 'tree', label: 'File tree' },
  { id: 'diagram', label: 'Diagram canvas' },
  { id: 'document', label: 'Document editor' }
]

const tool = (id: string, key: string, name: string): ShortcutDef => ({
  id: `diagram.tool.${id}`,
  keys: [key],
  scope: 'diagram',
  description: `${name} tool`
})

export const SHORTCUTS = [
  // General
  {
    id: 'search.open',
    keys: ['mod+k'],
    scope: 'global',
    description: 'Search the workspace',
    whileTyping: true
  },
  {
    id: 'shortcuts.help',
    keys: ['mod+/'],
    scope: 'global',
    description: 'Keyboard shortcuts',
    whileTyping: true
  },
  { id: 'file.save', keys: ['mod+s'], scope: 'global', description: 'Save now', whileTyping: true },
  {
    id: 'tab.close',
    keys: ['mod+w'],
    scope: 'global',
    description: 'Close tab',
    whileTyping: true
  },
  {
    id: 'tab.next',
    keys: ['ctrl+tab'],
    scope: 'global',
    description: 'Next tab',
    whileTyping: true
  },
  {
    id: 'tab.previous',
    keys: ['ctrl+shift+tab'],
    scope: 'global',
    description: 'Previous tab',
    whileTyping: true
  },
  {
    id: 'panel.sidebar',
    keys: ['mod+b'],
    scope: 'global',
    description: 'Toggle sidebar',
    whileTyping: true
  },
  {
    id: 'panel.inspector',
    keys: ['mod+alt+b'],
    scope: 'global',
    description: 'Toggle properties',
    whileTyping: true
  },
  {
    id: 'zoom.in',
    keys: ['mod+=', 'mod+shift+=', 'mod+plus'],
    scope: 'global',
    description: 'Zoom in',
    whileTyping: true
  },
  { id: 'zoom.out', keys: ['mod+-'], scope: 'global', description: 'Zoom out', whileTyping: true },
  {
    id: 'zoom.reset',
    keys: ['mod+0'],
    scope: 'global',
    description: 'Reset zoom',
    whileTyping: true
  },
  // File tree (on a focused row)
  { id: 'tree.open', keys: ['enter'], scope: 'tree', description: 'Open, or expand a folder' },
  { id: 'tree.rename', keys: ['f2'], scope: 'tree', description: 'Rename' },
  { id: 'tree.delete', keys: ['delete', 'backspace'], scope: 'tree', description: 'Move to trash' },
  // Diagram canvas
  tool('select', 'v', 'Select'),
  tool('pan', 'h', 'Pan'),
  tool('node', 'n', 'Add node'),
  tool('connect', 'c', 'Connect'),
  tool('text', 't', 'Text'),
  tool('rect', 'r', 'Rectangle'),
  tool('ellipse', 'o', 'Ellipse'),
  {
    id: 'diagram.delete',
    keys: ['delete', 'backspace'],
    scope: 'diagram',
    description: 'Delete selection'
  },
  { id: 'diagram.undo', keys: ['mod+z'], scope: 'diagram', description: 'Undo' },
  { id: 'diagram.redo', keys: ['mod+shift+z', 'ctrl+y'], scope: 'diagram', description: 'Redo' },
  { id: 'diagram.copy', keys: ['mod+c'], scope: 'diagram', description: 'Copy nodes' },
  { id: 'diagram.paste', keys: ['mod+v'], scope: 'diagram', description: 'Paste nodes' },
  { id: 'diagram.duplicate', keys: ['mod+d'], scope: 'diagram', description: 'Duplicate nodes' },
  { id: 'diagram.cancel', keys: ['escape'], scope: 'diagram', description: 'Cancel a connection' },
  // Document editor (TipTap handles these)
  {
    id: 'document.bold',
    keys: ['mod+b'],
    scope: 'document',
    description: 'Bold',
    listedOnly: true
  },
  {
    id: 'document.italic',
    keys: ['mod+i'],
    scope: 'document',
    description: 'Italic',
    listedOnly: true
  },
  {
    id: 'document.code',
    keys: ['mod+e'],
    scope: 'document',
    description: 'Inline code',
    listedOnly: true
  },
  {
    id: 'document.undo',
    keys: ['mod+z'],
    scope: 'document',
    description: 'Undo',
    listedOnly: true
  },
  {
    id: 'document.redo',
    keys: ['mod+shift+z'],
    scope: 'document',
    description: 'Redo',
    listedOnly: true
  }
] as const satisfies readonly ShortcutDef[]

export type ShortcutId = (typeof SHORTCUTS)[number]['id']

/** `Mod+Shift+Z` and `mod+shift+z` are the same combo. */
export const normalizeCombo = (combo: string): string => {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop() ?? ''
  return [...['mod', 'ctrl', 'alt', 'shift'].filter((m) => parts.includes(m)), key].join('+')
}

/**
 * Throws when two shortcuts share a combo in one scope. A global shortcut
 * clashes with every scope, since it fires everywhere.
 */
export function assertNoConflicts(shortcuts: readonly ShortcutDef[]): void {
  const seen = new Map<string, ShortcutDef[]>()
  for (const shortcut of shortcuts) {
    if (shortcut.listedOnly) continue
    for (const combo of shortcut.keys) {
      const key = normalizeCombo(combo)
      const others = seen.get(key) ?? []
      const clash = others.find(
        (o) => o.scope === shortcut.scope || o.scope === 'global' || shortcut.scope === 'global'
      )
      if (clash)
        throw new Error(`Shortcut conflict: ${clash.id} and ${shortcut.id} both use ${combo}`)
      seen.set(key, [...others, shortcut])
    }
  }
}

export function getShortcut(id: ShortcutId): ShortcutDef {
  const found = (SHORTCUTS as readonly ShortcutDef[]).find((s) => s.id === id)
  if (!found) throw new Error(`Unknown shortcut: ${id}`)
  return found
}
