import { EmptyState } from '@/shared/components/ui'

export function EmptySelection(): React.JSX.Element {
  return (
    <EmptyState className="px-4 py-6">
      Nothing selected.
      <br />
      Pick a node on the canvas, or use the Add Node tool to place one.
    </EmptyState>
  )
}
