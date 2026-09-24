import { IconButton, SearchInput } from '@/shared/components/ui'

export interface SidebarFooterProps {
  query: string
  onQueryChange: (query: string) => void
  onToggleInspector: () => void
}

export function SidebarFooter({
  query,
  onQueryChange,
  onToggleInspector
}: SidebarFooterProps): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5">
      <SearchInput
        value={query}
        placeholder="Search files"
        containerClassName="flex-1"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && query !== '') {
            event.stopPropagation()
            onQueryChange('')
          }
        }}
      />
      <IconButton icon="gear" label="Toggle properties" size="md" onClick={onToggleInspector} />
    </div>
  )
}
