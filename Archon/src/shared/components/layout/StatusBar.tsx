import type { ReactNode } from 'react'

export interface StatusBarProps {
  /** State and file path; the path segment grows into the free space. */
  left?: ReactNode
  /** Counters, selection, theme and zoom, pushed to the right edge. */
  right?: ReactNode
}

/** 24px bottom bar. Segments hide by priority as the bar narrows (`StatusSegment`). */
export function StatusBar({ left, right }: StatusBarProps): React.JSX.Element {
  return (
    // The container carries no padding: container queries measure the content
    // box, and the priority thresholds refer to the bar's full width.
    <footer className="statusbar h-[var(--size-statusbar)] shrink-0 overflow-hidden border-t border-border bg-side text-[11px] whitespace-nowrap text-fg-muted">
      <div className="flex h-full items-center gap-3.5 px-3">
        <div className="flex min-w-0 flex-auto items-center gap-3.5">{left}</div>
        <div className="ml-auto flex shrink-0 items-center gap-3.5">{right}</div>
      </div>
    </footer>
  )
}
