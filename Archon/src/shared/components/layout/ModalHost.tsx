import type { ComponentType } from 'react'
import type { ModalId } from '@/core/types'
import { useUiStore } from '@/store'

export interface ModalHostProps {
  /** Components registered in `App.tsx`; each closes itself via `closeModal`. */
  modals: Partial<Record<ModalId, ComponentType>>
}

/** Renders the app-level modal named by `ui.store.activeModal`, if registered. */
export function ModalHost({ modals }: ModalHostProps): React.JSX.Element | null {
  const activeModal = useUiStore((s) => s.activeModal)
  const Active = activeModal ? modals[activeModal] : undefined
  return Active ? <Active /> : null
}
