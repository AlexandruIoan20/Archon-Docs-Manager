import { describe, expect, it } from 'vitest'
import { fileToGraph } from '../../utils/graph-mapping'
import { PHISHING } from '@/test/sample-diagram'
import {
  createDiagramStore,
  selectCounts,
  selectSelectionId,
  type DiagramStoreApi
} from '../diagram.store'

const make = (): DiagramStoreApi => createDiagramStore(fileToGraph(PHISHING), PHISHING)

describe('diagram store', () => {
  it('moves a node and counts it as an edit', () => {
    const store = make()
    store.getState().onNodesChange([{ type: 'position', id: 'N2', position: { x: 40, y: 200 } }])
    expect(store.getState().nodes[1]?.position).toEqual({ x: 40, y: 200 })
    expect(store.getState().revision).toBe(1)
  })

  it('does not count selecting or measuring as edits', () => {
    const store = make()
    store.getState().onNodesChange([
      { type: 'select', id: 'N1', selected: true },
      { type: 'dimensions', id: 'N1', dimensions: { width: 176, height: 64 } }
    ])
    store.getState().onEdgesChange([{ type: 'select', id: 'E1', selected: true }])
    expect(store.getState().nodes[0]?.selected).toBe(true)
    expect(store.getState().revision).toBe(0)

    store.getState().onEdgesChange([{ type: 'remove', id: 'E2' }])
    expect(store.getState().edges).toHaveLength(1)
    expect(store.getState().revision).toBe(1)
  })

  it('saves a viewport only when asked', () => {
    const store = make()
    store.getState().setViewport({ x: 5, y: 5, zoom: 1.2 }, false)
    expect(store.getState().viewport.zoom).toBe(1.2)
    expect(store.getState().revision).toBe(0)
    store.getState().setViewport({ x: 5, y: 5, zoom: 1.3 }, true)
    expect(store.getState().revision).toBe(1)
    // A pan ends where the live updates already put the viewport: still saved.
    store.getState().setViewport({ x: 9, y: 9, zoom: 1.3 }, false)
    store.getState().setViewport({ x: 9, y: 9, zoom: 1.3 }, true)
    expect(store.getState().revision).toBe(2)
  })

  it('tracks the selection for the status bar', () => {
    const store = make()
    expect(selectSelectionId(store.getState())).toBeNull()
    store.getState().setSelection({ nodes: ['N2'], edges: ['E1'] })
    expect(selectSelectionId(store.getState())).toBe('N2')
    store.getState().setSelection({ nodes: [], edges: ['E1'] })
    expect(selectSelectionId(store.getState())).toBe('E1')
    expect(selectCounts(store.getState())).toBe('2 nodes · 2 edges')
  })

  it('replaces the graph from disk without an edit', () => {
    const store = make()
    store.getState().setSelection({ nodes: ['N1'], edges: [] })
    const next = fileToGraph({ ...PHISHING, data: { ...PHISHING.data, nodes: [], edges: [] } })
    store.getState().replaceGraph(next)
    expect(store.getState()).toMatchObject({ nodes: [], edges: [], revision: 0 })
    expect(store.getState().selection).toEqual({ nodes: [], edges: [] })
    expect(selectCounts(store.getState())).toBe('0 nodes · 0 edges')
  })
})
