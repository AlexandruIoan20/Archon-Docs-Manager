import { cn } from '@/shared/utils/cn'
import { snippetParts } from '../utils/snippet-parts'

export function HighlightedSnippet({
  snippet,
  className
}: {
  snippet: string
  className?: string
}): React.JSX.Element {
  return (
    <span className={cn('min-w-0 truncate', className)}>
      {snippetParts(snippet).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-transparent font-medium text-accent-fg">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  )
}
