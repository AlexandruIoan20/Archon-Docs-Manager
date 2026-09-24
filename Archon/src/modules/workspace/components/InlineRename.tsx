import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { fileNameProblem } from '@/core/validation/file-name'
import { cn } from '@/shared/utils/cn'

export interface InlineRenameProps {
  initialName: string
  /** Rejects with an error whose message is shown under the field. */
  onSubmit: (name: string) => Promise<unknown>
  onDone: () => void
}

/**
 * Name field inside a tree row. Enter confirms, Escape cancels, leaving the
 * field confirms (or cancels if the name is invalid, since the field is gone).
 */
export function InlineRename({
  initialName,
  onSubmit,
  onDone
}: InlineRenameProps): React.JSX.Element {
  const [value, setValue] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = async (fromBlur: boolean): Promise<void> => {
    if (busy) return
    const name = value.trim()
    if (name === initialName) return onDone()
    const problem = fileNameProblem(name)
    if (problem) {
      if (fromBlur) return onDone()
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await onSubmit(name)
      onDone()
    } catch (submitError) {
      setBusy(false)
      if (fromBlur) return onDone()
      setError((submitError as Error).message)
      inputRef.current?.focus()
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    // The row's own keys (arrows, Enter, Delete) must not fire while typing.
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      void commit(false)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onDone()
    }
  }

  return (
    <span className="relative min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
      <input
        ref={inputRef}
        value={value}
        aria-label="New name"
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        disabled={busy}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => void commit(true)}
        className={cn(
          'h-[22px] w-full min-w-0 rounded-xs border bg-bg px-1 text-[13px] text-fg outline-none',
          error ? 'border-danger' : 'border-accent-border'
        )}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          className="absolute top-full left-0 z-10 mt-0.5 w-max max-w-[240px] rounded-xs border border-danger bg-surface px-1.5 py-0.5 text-[11px] leading-snug whitespace-normal text-fg shadow-menu"
        >
          {error}
        </span>
      )}
    </span>
  )
}
