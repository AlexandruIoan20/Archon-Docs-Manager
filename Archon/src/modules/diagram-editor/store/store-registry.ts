import { create } from 'zustand'
import { useStore } from 'zustand'
import { useEditorStore } from '@/store'
import { createDiagramStore, type DiagramState, type DiagramStoreApi } from './diagram.store'

/**
 * The diagram store of each open tab, by tab id. The editor creates it; the
 * toolbar, inspector and status bar (other slots of the shell) find it here.
 * A store outlives tab switches and goes away when its tab closes.
 */
const useRegistry = create<{ stores: Record<string, DiagramStoreApi> }>()(() => ({ stores: {} }))

let pruning = false

/** Drops the stores of tabs that were closed. */
function pruneWithTabs(): void {
  if (pruning) return
  pruning = true
  useEditorStore.subscribe((state) => {
    const open = new Set(state.tabs.map((tab) => tab.id))
    const { stores } = useRegistry.getState()
    const closed = Object.keys(stores).filter((id) => !open.has(id))
    if (closed.length === 0) return
    const next = { ...stores }
    for (const id of closed) delete next[id]
    useRegistry.setState({ stores: next })
  })
}

export function getStore(tabId: string): DiagramStoreApi | undefined {
  return useRegistry.getState().stores[tabId]
}

export function registerStore(tabId: string, store: DiagramStoreApi): void {
  pruneWithTabs()
  useRegistry.setState((state) => ({ stores: { ...state.stores, [tabId]: store } }))
}

export function removeStore(tabId: string): void {
  useRegistry.setState((state) => {
    if (!(tabId in state.stores)) return state
    const stores = { ...state.stores }
    delete stores[tabId]
    return { stores }
  })
}

/** The store registered for `tabId`, following registrations. */
export function useRegisteredStore(tabId: string): DiagramStoreApi | undefined {
  return useRegistry((state) => state.stores[tabId])
}

// Stands in while a tab has no store yet, so hooks keep a stable call order.
const EMPTY_STORE = createDiagramStore({
  meta: {} as DiagramState['meta'],
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 }
})

/** A value from the diagram store of `tabId`; `undefined` until the diagram is loaded. */
export function useDiagramStoreFor<T>(
  tabId: string,
  selector: (state: DiagramState) => T
): T | undefined {
  const store = useRegistry((state) => state.stores[tabId])
  return useStore(store ?? EMPTY_STORE, (state) => (store ? selector(state) : undefined))
}
