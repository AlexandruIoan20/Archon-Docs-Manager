import type { ComponentType } from 'react'

export type FileKind = 'soardoc' | 'soardiag'

export interface EditorTabRef {
  tabId: string
  filePath: string
  kind: FileKind
}

export interface EditorSlotProps {
  tab: EditorTabRef
}

/**
 * What an editor module plugs into the shell. The shell only knows this
 * contract; `App.tsx` registers one contribution per file kind.
 */
export interface EditorContribution {
  kind: FileKind
  /** Main area. */
  Editor: ComponentType<EditorSlotProps>
  /** Title bar, left slot. Reads `useTitleBarDensity()` to fold its tools. */
  Toolbar?: ComponentType<EditorSlotProps>
  /** Title bar, right slot (Export). */
  TitleActions?: ComponentType<EditorSlotProps>
  /** Right-hand panel. */
  Inspector?: ComponentType<EditorSlotProps>
  /** Segments in the status bar. */
  StatusItems?: ComponentType<EditorSlotProps>
}
