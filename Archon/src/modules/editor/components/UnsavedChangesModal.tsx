import { useId, useRef, useState } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { saveTab } from '@/core/editor/save-registry'
import { useEditorStore, useUiStore } from '@/store'
import { Button, Modal } from '@/shared/components/ui'
import { useCloseGuardStore } from '../store/close-guard.store'

/** Registered in `App.tsx` as the `unsaved-changes` modal: Save / Don't save / Cancel. */
export function UnsavedChangesModal(): React.JSX.Element | null {
  const titleId = useId()
  const saveRef = useRef<HTMLButtonElement>(null)
  const [saving, setSaving] = useState(false)
  const pending = useCloseGuardStore((s) => s.pending)
  const setPending = useCloseGuardStore((s) => s.setPending)
  const allTabs = useEditorStore((s) => s.tabs)
  const closeModal = useUiStore((s) => s.closeModal)

  if (!pending) return null
  const tabs = allTabs.filter((tab) => pending.tabIds.includes(tab.id))

  const finish = (): void => {
    setPending(null)
    closeModal()
  }
  const release = (ids: readonly string[]): void => {
    if (pending.quit) {
      void ipcClient.app.confirmClose()
    } else {
      const { close } = useEditorStore.getState()
      for (const id of ids) close(id)
    }
  }

  const save = async (): Promise<void> => {
    setSaving(true)
    const failed: string[] = []
    for (const tab of tabs) if (!(await saveTab(tab.id))) failed.push(tab.id)
    setSaving(false)
    if (failed.length === 0) {
      finish()
      release(tabs.map((tab) => tab.id))
      return
    }
    const names = tabs.filter((tab) => failed.includes(tab.id)).map((tab) => tab.title)
    useUiStore.getState().notify(`Could not save ${names.join(', ')}`, 'error')
    if (!pending.quit) {
      const { close } = useEditorStore.getState()
      for (const tab of tabs) if (!failed.includes(tab.id)) close(tab.id)
    }
    setPending({ ...pending, tabIds: failed })
  }
  const discard = (): void => {
    finish()
    release(tabs.map((tab) => tab.id))
  }

  const [first] = tabs
  const title =
    tabs.length === 1 && first
      ? `Save changes to “${first.title}”?`
      : `${tabs.length} files have unsaved changes`

  return (
    <Modal open onClose={finish} width={420} aria-labelledby={titleId} initialFocusRef={saveRef}>
      <div className="p-5">
        <h2 id={titleId} className="text-[14px] font-semibold text-fg">
          {title}
        </h2>
        {tabs.length > 1 && (
          <ul className="mt-2 max-h-40 overflow-y-auto font-mono text-[11px] text-fg-subtle">
            {tabs.map((tab) => (
              <li key={tab.id} className="truncate" title={tab.relPath}>
                {tab.relPath}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
          Your changes will be lost if you don’t save them.
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
        <Button onClick={finish}>Cancel</Button>
        <Button variant="danger-outline" onClick={discard} disabled={saving}>
          Don’t save
        </Button>
        <Button ref={saveRef} variant="primary" onClick={() => void save()} disabled={saving}>
          Save
        </Button>
      </div>
    </Modal>
  )
}
