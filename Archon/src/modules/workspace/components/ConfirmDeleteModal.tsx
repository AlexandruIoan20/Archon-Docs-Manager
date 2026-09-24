import { useId, useRef } from 'react'
import { useUiStore, useWorkspaceStore } from '@/store'
import { Button, Modal } from '@/shared/components/ui'
import { useFileActions } from '../hooks/useFileActions'

/** Registered in `App.tsx` as the `confirm-delete` modal. */
export function ConfirmDeleteModal(): React.JSX.Element | null {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const pending = useWorkspaceStore((s) => s.pendingDelete)
  const setPendingDelete = useWorkspaceStore((s) => s.setPendingDelete)
  const closeModal = useUiStore((s) => s.closeModal)
  const { remove } = useFileActions()

  if (!pending) return null

  const close = (): void => {
    closeModal()
    setPendingDelete(null)
  }
  const confirm = (): void => {
    close()
    void remove(pending.relPath)
  }

  return (
    <Modal open onClose={close} width={400} aria-labelledby={titleId} initialFocusRef={cancelRef}>
      <div className="p-5">
        <h2 id={titleId} className="text-[14px] font-semibold text-fg">
          Move “{pending.name}” to the trash?
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
          {pending.isFolder
            ? 'The folder and everything in it go to the system trash. You can restore them from there.'
            : 'The file goes to the system trash. You can restore it from there.'}
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
        <Button ref={cancelRef} onClick={close}>
          Cancel
        </Button>
        <Button variant="danger-outline" icon="trash" onClick={confirm}>
          Move to trash
        </Button>
      </div>
    </Modal>
  )
}
