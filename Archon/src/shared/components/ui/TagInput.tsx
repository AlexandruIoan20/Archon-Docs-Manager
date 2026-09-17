import { useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

export interface TagInputProps {
  tags: readonly string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder?: string
  id?: string
  'aria-label'?: string
  className?: string
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = 'Add tag…',
  id,
  className,
  ...aria
}: TagInputProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
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
}
