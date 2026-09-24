import { create } from 'zustand'

export interface PendingClose {
  /** Tabs with changes that could not be saved automatically. */
  tabIds: string[]
  /** The window is closing: answering releases it instead of closing tabs. */
  quit: boolean
}

interface CloseGuardState {
  pending: PendingClose | null
  setPending: (pending: PendingClose | null) => void
}

/** Local to the editor module: what `UnsavedChangesModal` is asking about. */
export const useCloseGuardStore = create<CloseGuardState>()((set) => ({
  pending: null,
  setPending: (pending) => set({ pending })
}))
