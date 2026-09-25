import type { RefObject } from 'react'
import { APP_NAME } from '@/core/constants/app.constants'
import { IconButton, SearchInput } from '@/shared/components/ui'

export interface DialogHeaderProps {
  titleId: string
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  searchRef: RefObject<HTMLInputElement | null>
}

/** Title, subtitle, search and close. Below 600px the search takes its own row. */
export function DialogHeader({
  titleId,
  query,
  onQueryChange,
  onClose,
  searchRef
}: DialogHeaderProps): React.JSX.Element {
  return (
    <header className="flex min-h-[52px] shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        <h2 id={titleId} className="shrink-0 text-[14px] font-semibold text-fg">
          New diagram
        </h2>
        <p className="min-w-0 truncate text-[12px] text-fg-muted">
          Choose a UML type — {APP_NAME} scaffolds the notation and shapes for you.
        </p>
      </div>
      <SearchInput
        ref={searchRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search diagram types"
        containerClassName="w-[220px] @max-[599.98px]/modal:order-last @max-[599.98px]/modal:w-full"
      />
      <IconButton icon="close" label="Close" size="md" onClick={onClose} />
    </header>
  )
}
