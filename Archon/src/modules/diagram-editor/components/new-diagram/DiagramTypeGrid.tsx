import { useRef, type KeyboardEvent } from 'react'
import type { UmlDiagramType } from '@/core/types'
import type { CatalogGroup } from '../../utils/filter-catalog'
import { DiagramTypeCard } from './DiagramTypeCard'

export interface DiagramTypeGridProps {
  groups: CatalogGroup[]
  selected: UmlDiagramType | null
  onSelect: (type: UmlDiagramType) => void
  onCreate: (type: UmlDiagramType) => void
  query: string
}

type Direction = 'up' | 'down'

/** The card above or below `from`: the nearest one in the closest row. */
function verticalNeighbour(
  cards: HTMLElement[],
  from: HTMLElement,
  dir: Direction
): HTMLElement | null {
  const origin = from.getBoundingClientRect()
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    const dy = dir === 'down' ? rect.top - origin.top : origin.top - rect.top
    if (dy <= 1) continue
    const score = dy * 1000 + Math.abs(rect.left - origin.left)
    if (score < bestScore) {
      best = card
      bestScore = score
    }
  }
  return best
}

/** The catalog, grouped; a listbox moved with the arrow keys, Home and End. */
export function DiagramTypeGrid({
  groups,
  selected,
  onSelect,
  onCreate,
  query
}: DiagramTypeGridProps): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null)

  if (groups.length === 0) {
    return (
      <p className="p-10 text-center text-[12px] text-fg-subtle">
        No diagram type matches “{query.trim()}”
      </p>
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const cards = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []
    )
    const index = cards.findIndex((card) => card.dataset.type === selected)
    const current = cards[index]
    let next: HTMLElement | null | undefined
    if (event.key === 'ArrowRight') next = cards[Math.min(index + 1, cards.length - 1)]
    else if (event.key === 'ArrowLeft') next = cards[Math.max(index - 1, 0)]
    else if (event.key === 'ArrowDown' && current) next = verticalNeighbour(cards, current, 'down')
    else if (event.key === 'ArrowUp' && current) next = verticalNeighbour(cards, current, 'up')
    else if (event.key === 'Home') next = cards[0]
    else if (event.key === 'End') next = cards.at(-1)
    else return
    event.preventDefault()
    if (!next?.dataset.type) return
    onSelect(next.dataset.type as UmlDiagramType)
    next.focus()
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Diagram types"
      onKeyDown={onKeyDown}
      className="px-[18px] py-4"
    >
      {groups.map(({ category, entries }) => (
        <section key={category.id} role="group" aria-label={category.label} className="mb-[18px]">
          <header className="mb-2.5 flex items-center gap-2.5">
            <h3 className="text-[11px] font-semibold tracking-[.6px] text-fg-muted uppercase">
              {category.label}
            </h3>
            <span aria-hidden className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-fg-subtle">{category.note}</span>
          </header>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {entries.map((entry) => (
              <DiagramTypeCard
                key={entry.id}
                entry={entry}
                selected={entry.id === selected}
                onSelect={() => onSelect(entry.id)}
                onCreate={() => onCreate(entry.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
