import { create } from 'zustand'

/** `ready`: green dot. `busy`: accent dot (e.g. while the connect tool is active). */
export type StatusTone = 'ready' | 'busy'

const READY = { statusText: 'Ready', statusTone: 'ready' } as const

export interface StatusState {
  statusText: string
  statusTone: StatusTone
  setStatus: (text: string, tone?: StatusTone) => void
  resetStatus: () => void
}

/**
 * The status bar's global state segment. File path and theme label derive from
 * other stores; editor segments come from their `StatusItems` contribution.
 */
export const useStatusStore = create<StatusState>()((set) => ({
  ...READY,
  setStatus: (statusText, statusTone = 'busy') => set({ statusText, statusTone }),
  resetStatus: () => set(READY)
}))
