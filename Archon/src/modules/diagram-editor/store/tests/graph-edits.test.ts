import { describe, expect, it } from 'vitest'
import { PHISHING } from '@/test/sample-diagram'
import { fileToGraph } from '../../utils/graph-mapping'
import {
  createDiagramStore,
  selectCanRedo,
  selectCanUndo,
  type DiagramStoreApi
} from '../diagram.store'

const make = (): DiagramStoreApi => createDiagramStore(fileToGraph(PHISHING), PHISHING)
const ids = (items: { id: string }[]): string[] => items.map((item) => item.id)

describe('graph edits', () => {
  it('adds a selected node and undoes it', () => {
    const store = make()
    const id = store.getState().addNode('decision', { x: 50, y: 50 })
    expect(id).toBe('N3')
    expect(
      store
        .getState()
        .nodes.filter((n) => n.selected)
        .map((n) => n.id)
    ).toEqual(['N3'])
    expect(store.getState().selection.nodes).toEqual(['N3'])

    expect(store.getState().undo()).toBe(true)
    expect(ids(store.getState().nodes)).toEqual(['N1', 'N2'])
    expect(store.getState().redo()).toBe(true)
    expect(ids(store.getState().nodes)).toEqual(['N1', 'N2', 'N3'])
  })

  it('deletes the selection with attached edges, and restores all of it', () => {
    const store = make()
    store.getState().onNodesChange([{ type: 'select', id: 'N2', selected: true }])
    expect(store.getState().deleteSelection()).toEqual({ nodes: 1, edges: 2 })
    expect(ids(store.getState().nodes)).toEqual(['N1'])
    expect(store.getState().edges).toEqual([])

    store.getState().undo()
    expect(ids(store.getState().nodes)).toEqual(['N1', 'N2'])
    expect(ids(store.getState().edges)).toEqual(['E1', 'E2'])
    expect(store.getState().deleteSelection()).toEqual({ nodes: 0, edges: 0 })
  })

  it('connects once, never to itself, and undoes the edge', () => {
    const store = make()
    store.getState().addNode('action', { x: 0, y: 400 })
    expect(store.getState().connect('N2', 'N3')).toBe('E3')
    expect(store.getState().connect('N2', 'N3')).toBeNull()
    expect(store.getState().connect('N3', 'N3')).toBeNull()
    store.getState().undo()
    expect(ids(store.getState().edges)).toEqual(['E1', 'E2'])
  })

  it('records a drag as one undo step', () => {
    const store = make()
    const move = (x: number, dragging: boolean): void =>
      store
        .getState()
        .onNodesChange([{ type: 'position', id: 'N1', position: { x, y: 0 }, dragging }])
    move(10, true)
    move(20, true)
    move(30, false)
    expect(store.getState().history.past).toHaveLength(1)
    store.getState().undo()
    expect(store.getState().nodes[0]?.position).toEqual({ x: 0, y: 0 })
  })

  it('styles selected shapes and edges, or the defaults without a selection', () => {
    const store = make()
    store.getState().applyStyle({ stroke: '#DC2626' })
    expect(store.getState().styleDefaults.stroke).toBe('#DC2626')
    expect(selectCanUndo(store.getState())).toBe(false)

    store.getState().addNode('shape-rect', { x: 0, y: 0 })
    expect(store.getState().nodes.at(-1)?.data.stroke).toBe('#DC2626')
    store.getState().applyStyle({ strokeWidth: 3, fill: '#2563EB' })
    expect(store.getState().nodes.at(-1)?.data).toMatchObject({ strokeWidth: 3, fill: '#2563EB' })

    store.getState().onEdgesChange([{ type: 'select', id: 'E1', selected: true }])
    store.getState().onNodesChange([{ type: 'select', id: 'N3', selected: false }])
    store.getState().applyStyle({ stroke: '#059669', fill: '#7C3AED' })
    expect(store.getState().edges[0]?.data).toEqual({ stroke: '#059669' })
  })

  it('cannot undo or redo past the ends', () => {
    const store = make()
    expect(store.getState().undo()).toBe(false)
    expect(store.getState().redo()).toBe(false)
    store.getState().addNode('action', { x: 0, y: 0 })
    store.getState().undo()
    expect(selectCanRedo(store.getState())).toBe(true)
    store.getState().addNode('trigger', { x: 0, y: 0 })
    expect(selectCanRedo(store.getState())).toBe(false)
  })

  it('switching tools drops a pending connection', () => {
    const store = make()
    store.getState().setTool('connect')
    store.getState().setConnectFrom('N1')
    store.getState().setTool('select')
    expect(store.getState().connectFrom).toBeNull()
  })
})
