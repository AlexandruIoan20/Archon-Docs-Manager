import type { ReactNode } from 'react'
import { useStatusStore, useUiStore } from '@/store'
import { StatusBar } from './StatusBar'
import { StatusPath } from './StatusPath'
import { StatusSegment } from './StatusSegment'

export interface ShellStatusBarProps {
  /** Active file, workspace-relative (plan 11). */
  activePath?: string
  /** The active editor's `StatusItems` (counters, selection, canvas zoom). */
  editorItems?: ReactNode
}

/** The app's status bar: global segments around the active editor's own ones. */
export function ShellStatusBar({
  activePath,
  editorItems
}: ShellStatusBarProps): React.JSX.Element {
  const statusText = useStatusStore((s) => s.statusText)
  const statusTone = useStatusStore((s) => s.statusTone)
  const resolvedTheme = useUiStore((s) => s.resolvedTheme)

  return (
    <StatusBar
      left={
        <>
          <StatusSegment dot={statusTone === 'ready' ? 'success' : 'accent'}>
            <span aria-live="polite">{statusText}</span>
          </StatusSegment>
          <StatusPath path={activePath} />
        </>
      }
      right={
        <>
          {editorItems}
          <StatusSegment mono priority={3}>
            {resolvedTheme.toUpperCase()}
          </StatusSegment>
        </>
      }
    />
  )
}
