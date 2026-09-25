import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PHISHING } from '@/test/sample-diagram'
import { createDiagramStore, type DiagramStoreApi } from '../../store/diagram.store'
import { DiagramStoreProvider } from '../../store/DiagramStoreProvider'
import { fileToGraph } from '../../utils/graph-mapping'
import { useSelectedElements } from '../useSelectedElements'

function setup(): {
  store: DiagramStoreApi
  result: { current: ReturnType<typeof useSelectedElements> }
} {
  const store = createDiagramStore(fileToGraph(PHISHING))
  const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element => (
    <DiagramStoreProvider store={store}>{children}</DiagramStoreProvider>
  )
  const { result } = renderHook(() => useSelectedElements(), { wrapper })
  return { store, result }
}

const select = (store: DiagramStoreApi, nodes: string[], edges: string[] = []): void =>
  act(() => {
    store.getState().onNodesChange(nodes.map((id) => ({ type: 'select', id, selected: true })))
    store.getState().onEdgesChange(edges.map((id) => ({ type: 'select', id, selected: true })))
  })

describe('useSelectedElements', () => {
  it('is none without a selection', () => {
    expect(setup().result.current).toEqual({ kind: 'none' })
  })

  it('gives the single node, following its edits', () => {
    const { store, result } = setup()
    select(store, ['N2'])
    expect(result.current).toMatchObject({ kind: 'node', node: { id: 'N2' } })
    act(() => store.getState().updateNodeData('N2', { label: 'Isolate' }))
    expect(result.current).toMatchObject({ kind: 'node', node: { data: { label: 'Isolate' } } })
  })

  it('gives the single edge', () => {
    const { store, result } = setup()
    select(store, [], ['E1'])
    expect(result.current).toMatchObject({ kind: 'edge', edge: { id: 'E1', label: 'yes' } })
  })

  it('gives the ids of several elements', () => {
    const { store, result } = setup()
    select(store, ['N1', 'N2'], ['E1'])
    expect(result.current).toEqual({ kind: 'multiple', nodeIds: ['N1', 'N2'], edgeIds: ['E1'] })
  })
})
