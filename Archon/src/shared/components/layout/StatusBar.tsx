import type { ReactNode } from 'react'

export interface StatusBarProps {
  children?: ReactNode
}

/** 24px bottom bar; segments arrive in plan 06. */
export function StatusBar({ children }: StatusBarProps): React.JSX.Element {
  return (
    <footer className="@container flex h-[var(--size-statusbar)] shrink-0 items-center gap-3.5 overflow-hidden border-t border-border bg-side px-3 text-[11px] whitespace-nowrap text-fg-muted">
      {children}
    </footer>
  )
}
