import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, EmptyState } from '@/shared/components/ui'

export interface EditorErrorBoundaryProps {
  /** Shown in the fallback, e.g. the file name. */
  label: string
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Keeps a crashing editor from taking down the app.
 *
 * The one class component in the codebase: React has no hook for error
 * boundaries (`getDerivedStateFromError` / `componentDidCatch` exist only on
 * classes), so the "function components only" rule has this exception.
 */
export class EditorErrorBoundary extends Component<EditorErrorBoundaryProps, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[editor] ${this.props.label} crashed`, error, info.componentStack)
  }

  private readonly retry = (): void => this.setState({ error: null })

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <EmptyState>
          <span className="text-fg">{this.props.label} could not be displayed.</span>
          <br />
          <span className="font-mono text-[11px] break-all">{error.message}</span>
        </EmptyState>
        <Button size="sm" onClick={this.retry}>
          Try again
        </Button>
      </div>
    )
  }
}
