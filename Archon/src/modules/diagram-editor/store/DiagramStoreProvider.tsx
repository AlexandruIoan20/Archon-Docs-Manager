import { createContext, useContext, type ReactNode } from 'react'
import { useStore } from 'zustand'
import type { DiagramState, DiagramStoreApi } from './diagram.store'

const DiagramStoreContext = createContext<DiagramStoreApi | null>(null)

/** Gives the canvas and its overlays the store of the tab they belong to. */
export function DiagramStoreProvider({
  store,
  children
}: {
  store: DiagramStoreApi
  children: ReactNode
}): React.JSX.Element {
  return <DiagramStoreContext value={store}>{children}</DiagramStoreContext>
}

// eslint-disable-next-line react-refresh/only-export-components -- the hooks belong with their provider
export function useDiagramStoreApi(): DiagramStoreApi {
  const store = useContext(DiagramStoreContext)
  if (!store) throw new Error('useDiagramStore needs a DiagramStoreProvider')
  return store
}

// eslint-disable-next-line react-refresh/only-export-components -- the hooks belong with their provider
export function useDiagramStore<T>(selector: (state: DiagramState) => T): T {
  return useStore(useDiagramStoreApi(), selector)
}
