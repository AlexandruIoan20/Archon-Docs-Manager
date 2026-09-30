import type { XYPosition } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { PHISHING } from '@/test/sample-diagram'
import { fileToGraph } from '../../utils/graph-mapping'
import { createDiagramStore, type DiagramStoreApi } from '../diagram.store'

const make = (): DiagramStoreApi => createDiagramStore(fileToGraph(PHISHING), PHISHING)
const position = (store: DiagramStoreApi, id: string): XYPosition =>
  store.getState().nodes.find((n) => n.id === id)!.position

describe('layout edits', () => {
  it('aligns the selection as one undo step', () => {
    const store = make()
    store.getState().addNode('action', { x: 400, y: 400 })
    store.getState().selectNodes(['N1', 'N3'])
    expect(store.getState().alignSelection('top')).toBe(1)
    expect(position(store, 'N3').y).toBe(0)
    store.getState().undo()
    expect(position(store, 'N3').y).not.toBe(0)
  })

  it('arranges the diagram, turns its edges and asks for a fit', () => {
    const store = make()
    const before = store.getState().fitRequest
    expect(store.getState().arrange('LR')).toBe(true)
    expect(store.getState().fitRequest).toBe(before + 1)
    expect(position(store, 'N2').x).toBeGreaterThan(position(store, 'N1').x)
    expect(store.getState().edges.find((e) => e.id === 'E1')).toMatchObject({
      sourceHandle: 'right',
      targetHandle: 'left'
    })
  })

  it('snaps a drag and shows guides until it ends', () => {
    const store = make()
    // N2 is 176 wide at x 0; dragged 4px off, it snaps back under N1.
    store
      .getState()
      .onNodesChange([{ type: 'position', id: 'N2', position: { x: 4, y: 300 }, dragging: true }])
    expect(position(store, 'N2')).toEqual({ x: 0, y: 300 })
    expect(store.getState().guides?.align.length).toBeGreaterThan(0)
    store.getState().onNodesChange([{ type: 'position', id: 'N2', dragging: false }])
    expect(store.getState().guides).toBeNull()
  })
})
