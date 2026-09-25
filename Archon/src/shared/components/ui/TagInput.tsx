import { useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

export interface TagInputProps {
  tags: readonly string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder?: string
  /** Known tags, offered under the field while the draft matches them. */
  suggestions?: readonly string[]
  id?: string
  'aria-label'?: string
  className?: string
}

const MAX_SUGGESTIONS = 6

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = 'Add tag…',
  suggestions,
  id,
  className,
  ...aria
}: TagInputProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const query = draft.trim().toLowerCase()
  const matches =
    query === '' || !suggestions
      ? []
      : suggestions
          .filter((tag) => !tags.includes(tag) && tag.toLowerCase().includes(query))
          .slice(0, MAX_SUGGESTIONS)

  const pick = (tag: string): void => {
    onAdd(tag)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const tag = draft.trim()
      if (tag && !tags.includes(tag)) onAdd(tag)
      setDraft('')
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onRemove(tags[tags.length - 1])
    }
  }

  const field = (
    <div
      className={cn(
        'flex min-h-[30px] w-full min-w-0 cursor-text flex-wrap items-center gap-[5px] rounded-sm border border-border bg-bg px-1.5 py-[5px] focus-within:border-accent-border',
        className
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
          inputRef.current?.focus()
        }
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5 max-w-full items-center gap-1 rounded-sm bg-accent-soft pr-1 pl-1.5 text-[11px] text-accent-fg"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onRemove(tag)}
            className="inline-flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-xs hover:bg-accent-border/40"
          >
            <Icon name="close" size={9} strokeWidth={2.4} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label={aria['aria-label'] ?? placeholder}
        className="h-5 min-w-[60px] flex-1 bg-transparent text-[11px] text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none"
      />
    </div>
  )

  if (!suggestions) return field
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      {field}
      {matches.length > 0 && (
        <ul aria-label="Tag suggestions" className="flex flex-wrap gap-[5px]">
          {matches.map((tag) => (
            <li key={tag} className="max-w-full">
              <button
                type="button"
                // Keeps the focus in the field, so typing can go on.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(tag)}
                className="inline-flex h-5 max-w-full cursor-pointer items-center rounded-sm border border-dashed border-border px-1.5 text-[11px] text-fg-muted hover:border-accent-border hover:text-accent-fg"
              >
                <span className="truncate">{tag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
