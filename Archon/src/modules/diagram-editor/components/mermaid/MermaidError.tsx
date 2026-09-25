import { cn } from '@/shared/utils/cn'

export interface MermaidErrorProps {
  error: { message: string; line: number | null } | null
  /** On a narrow preview the pill moves up, clear of the zoom controls. */
  raised?: boolean
}

/** A syntax error, as a danger pill at the bottom centre, with its line. */
export function MermaidError({
  error,
  raised = false
}: MermaidErrorProps): React.JSX.Element | null {
  if (!error) return null
  const text = error.line === null ? error.message : `Line ${error.line}: ${error.message}`
  return (
    <div
      role="alert"
      title={text}
      className={cn(
        'absolute left-1/2 z-10 flex h-7 max-w-[calc(100%-32px)] -translate-x-1/2 items-center rounded-[14px] border border-danger bg-surface px-3 text-[12px] text-danger',
        raised ? 'bottom-14' : 'bottom-5'
      )}
    >
      <span className="truncate">{text}</span>
    </div>
  )
}
