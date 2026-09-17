// Part of the temporary primitives preview (plan 02); removed in plan 04.
import { Button, EmptyState, Modal, ModalBody } from '@/shared/components/ui'

export function PreviewModal({
  open,
  onClose
}: {
  open: boolean
  onClose: () => void
}): React.JSX.Element {
  return (
    <Modal open={open} onClose={onClose} width={940} height={712} aria-label="Modal preview">
      <div className="flex h-[52px] shrink-0 items-center border-b border-border px-4 text-sm font-semibold">
        Modal preview
      </div>
      <ModalBody className="p-4">
        <EmptyState>
          Resize the window: the dialog stays inside it and this body scrolls.
        </EmptyState>
        <div className="h-[900px]" />
      </ModalBody>
      <div className="flex h-14 shrink-0 items-center justify-end gap-3 border-t border-border bg-side px-4">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary">Create diagram</Button>
      </div>
    </Modal>
  )
}
