import type { SearchResult } from '@/core/types'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { truncateMiddle } from '@/shared/utils/truncate-middle'
import type { ResultGroupId } from '../utils/group-results'
import { HighlightedSnippet } from './HighlightedSnippet'

export interface SearchResultRowProps {
  id: string
  result: SearchResult
  group: ResultGroupId
  active: boolean
  onHover: () => void
  onOpen: () => void
}

const icon = (result: SearchResult, group: ResultGroupId): IconName =>
  group === 'nodes' ? 'box' : result.kind === 'soardiag' ? 'flow' : 'file'

/** One result: name, where it is (path cut in the middle), the matched text. */
export function SearchResultRow({
  id,
  result,
  group,
  active,
  onHover,
  onOpen
}: SearchResultRowProps): React.JSX.Element {
  const title = group === 'nodes' ? (result.nodeLabel ?? result.nodeId ?? '') : result.fileTitle
  return (
    <div
      id={id}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onOpen}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-sm px-3 py-1.5',
        active ? 'bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]' : 'hover:bg-surface-2'
      )}
    >
      <Icon name={icon(result, group)} size={14} className="mt-0.5 shrink-0 text-fg-muted" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate text-[13px] text-fg">{title || 'Untitled'}</span>
          {group === 'nodes' && (
            <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{result.nodeId}</span>
          )}
          <span
            title={result.relPath}
            className="ml-auto min-w-0 shrink truncate font-mono text-[10px] text-fg-subtle"
          >
            {truncateMiddle(result.relPath, 48)}
          </span>
        </div>
        {group !== 'files' && (
          <HighlightedSnippet snippet={result.snippet} className="text-[11px] text-fg-muted" />
        )}
      </div>
    </div>
  )
}
