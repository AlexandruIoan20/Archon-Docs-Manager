import { Button } from '@/shared/components/ui'
import { useDiagramStoreApi } from '../../store/DiagramStoreProvider'
import { useDeleteSelection } from '../../hooks/useDeleteSelection'

/** The panel's last section: same action and toast as the Delete key. */
export function DeleteButton({ children }: { children: string }): React.JSX.Element {
  const remove = useDeleteSelection(useDiagramStoreApi())
  return (
    <Button variant="danger-outline" className="w-full" onClick={remove}>
      {children}
    </Button>
  )
}
