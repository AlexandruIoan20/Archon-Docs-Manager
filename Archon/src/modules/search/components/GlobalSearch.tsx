import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchPaletteStore, useUiStore } from '@/store'
import { Icon } from '@/shared/components/icons'
import { Kbd, Modal } from '@/shared/components/ui'
import { useSearch } from '../hooks/useSearch'
import { groupResults } from '../utils/group-results'
import { openSearchResult } from '../utils/open-result'
import { SearchResultRow } from './SearchResultRow'

const TOP = 'min(12vh, 96px)'

/** Registered in `App.tsx` as the `command-palette` modal (Ctrl/Cmd+K). */
export function GlobalSearch(): React.JSX.Element {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const closeModal = useUiStore((s) => s.closeModal)
  const request = useSearchPaletteStore((s) => s.request)
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const search = useSearch(text)

  const results = request.kind
    ? search.results.filter((r) => r.kind === request.kind)
    : search.results
  const groups = groupResults(results, search.query)
  const flat = groups.flatMap((group) =>
    group.results.map((result) => ({ group: group.id, result }))
  )
  const current = Math.min(active, Math.max(flat.length - 1, 0))
  const optionId = (index: number): string => `${listId}-${index}`

  const open = (index: number): void => {
    const item = flat[index]
    if (!item) return
    closeModal()
    if (request.onPick) request.onPick(item.result)
    else openSearchResult(item.result)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }
    if (event.key in moves && flat.length > 0) {
      event.preventDefault()
      const next = (current + (moves[event.key] ?? 0) + flat.length) % flat.length
      setActive(next)
      document.getElementById(optionId(next))?.scrollIntoView?.({ block: 'nearest' })
    } else if (event.key === 'Enter') {
      event.preventDefault()
      open(current)
    }
  }

  let index = -1
  return (
    <Modal
      open
      onClose={closeModal}
      width={640}
      position="top"
      maxHeight={`min(480px, 100vh - ${TOP} - 16px)`}
      aria-label="Search the workspace"
      initialFocusRef={inputRef}
    >
      <label className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <Icon name="search" size={16} className="shrink-0 text-fg-subtle" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-activedescendant={flat.length > 0 ? optionId(current) : undefined}
          aria-label="Search"
          placeholder={request.placeholder ?? 'Search files, nodes and content'}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none"
        />
      </label>

      <div
        id={listId}
        role="listbox"
        aria-label="Results"
        className="min-h-0 flex-1 overflow-y-auto py-1.5"
      >
        {search.tooShort ? (
          <p className="px-4 py-6 text-center text-[12px] text-fg-subtle">
            Type at least 2 characters.
          </p>
        ) : search.error ? (
          <p role="alert" className="px-4 py-6 text-center text-[12px] text-danger">
            {search.error.message}
          </p>
        ) : flat.length === 0 && !search.loading ? (
          <p className="px-4 py-6 text-center text-[12px] text-fg-subtle">
            No results for “{search.query}”
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.id} role="group" aria-label={group.label} className="px-1.5 pb-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[.6px] text-fg-subtle uppercase">
                {group.label}
              </div>
              {group.results.map((result) => {
                index += 1
                const i = index
                return (
                  <SearchResultRow
                    key={`${result.fileId}:${result.nodeId ?? ''}`}
                    id={optionId(i)}
                    result={result}
                    group={group.id}
                    active={i === current}
                    onHover={() => setActive(i)}
                    onOpen={() => open(i)}
                  />
                )
              })}
            </div>
          ))
        )}
      </div>

      <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-border bg-side px-4 text-[11px] text-fg-subtle @max-[479.98px]/modal:hidden">
        <span>
          <Kbd>↑↓</Kbd> navigate
        </span>
        <span>
          <Kbd>⏎</Kbd> open
        </span>
        <span>
          <Kbd>esc</Kbd> close
        </span>
      </footer>
    </Modal>
  )
}
