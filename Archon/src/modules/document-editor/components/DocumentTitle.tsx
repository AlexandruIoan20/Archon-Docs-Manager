import type { KeyboardEvent } from 'react'

export interface DocumentTitleProps {
  value: string
  onChange: (title: string) => void
  /** Enter moves on to the body. */
  onEnter: () => void
}

/** The document's title (not its file name), styled as the 26px heading. */
export function DocumentTitle({ value, onChange, onEnter }: DocumentTitleProps): React.JSX.Element {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    onEnter()
  }

  return (
    <input
      value={value}
      maxLength={200}
      placeholder="Untitled"
      aria-label="Document title"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className="doc-title mb-4 w-full min-w-0 border-0 bg-transparent p-0 font-bold text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none"
    />
  )
}
