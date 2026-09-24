import { useEffect } from 'react'
import { useStatusStore } from '@/store'
import type { DiagramStoreApi } from '../store/diagram.store'

export const CONNECTING_STATUS = 'Connecting…'

/** „Connecting…” in the status bar while the connect tool has picked a source. */
export function useConnectingStatus(store: DiagramStoreApi | null): void {
  useEffect(() => {
    if (!store) return
    const show = (connecting: boolean): void => {
      const status = useStatusStore.getState()
      if (connecting) status.setStatus(CONNECTING_STATUS)
      else if (status.statusText === CONNECTING_STATUS) status.resetStatus()
    }
    show(store.getState().connectFrom !== null)
    const unsubscribe = store.subscribe((state, prev) => {
      if ((state.connectFrom === null) !== (prev.connectFrom === null)) {
        show(state.connectFrom !== null)
      }
    })
    return () => {
      unsubscribe()
      show(false)
    }
  }, [store])
}
