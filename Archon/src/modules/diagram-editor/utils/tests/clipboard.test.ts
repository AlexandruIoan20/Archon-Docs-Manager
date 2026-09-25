import { describe, expect, it } from 'vitest'
import type { FlowEdge, FlowNode } from '../graph-mapping'
import {
  CLIPBOARD_MIME,
  copySelection,
  parseClipboard,
  pasteGraph,
  serializeClipboard
} from '../clipboard'
import { createNode } from '../node-factory'
import { DEFAULT_STYLE } from '../../store/tool.store'

const node = (id: string, x: number, selected = false): FlowNode => ({
  ...createNode('action', { x: x + 88, y: 32 }, [], DEFAULT_STYLE),
  id,
  selected
})
const edge = (id: string, source: string, target: string): FlowEdge => ({
  id,
  source,
  target,
  type: 'soar'
})

const NODES = [node('N1', 0, true), node('N2', 300, true), node('N3', 600)]
const EDGES = [edge('E1', 'N1', 'N2'), edge('E2', 'N2', 'N3')]

describe('node clipboard', () => {
  it('copies the selected nodes with the edges between them only', () => {
    const payload = copySelection(NODES, EDGES)
    expect(payload?.type).toBe(CLIPBOARD_MIME)
    expect(payload?.nodes.map((n) => n.id)).toEqual(['N1', 'N2'])
    expect(payload?.edges.map((e) => e.id)).toEqual(['E1'])
    expect(payload?.nodes[0]).not.toHaveProperty('selected')
  })

  it('pastes with new ids, remapped edges and the offset', () => {
    const payload = copySelection(NODES, EDGES)!
    const { nodes, edges } = pasteGraph(payload, NODES, EDGES, { offset: 24 })
    expect(nodes.map((n) => n.id)).toEqual(['N4', 'N5'])
    expect(nodes.map((n) => n.position)).toEqual([
      { x: 24, y: 24 },
      { x: 324, y: 24 }
    ])
    expect(nodes.every((n) => n.selected)).toBe(true)
    expect(edges).toEqual([expect.objectContaining({ id: 'E3', source: 'N4', target: 'N5' })])
  })

  it('pastes at a point: the top-left of the copy goes there', () => {
    const payload = copySelection(NODES, EDGES)!
    const { nodes } = pasteGraph(payload, NODES, EDGES, { at: { x: 1000, y: 500 } })
    expect(nodes.map((n) => n.position)).toEqual([
      { x: 1000, y: 500 },
      { x: 1300, y: 500 }
    ])
  })

  it('round-trips through text, and ignores any other text', () => {
    const payload = copySelection(NODES, EDGES)!
    const parsed = parseClipboard(serializeClipboard(payload))
    expect(parsed?.nodes.map((n) => [n.id, n.data.label])).toEqual([
      ['N1', 'Action'],
      ['N2', 'Action']
    ])
    expect(parseClipboard('hello')).toBeNull()
    expect(parseClipboard(JSON.stringify({ type: 'other', nodes: [], edges: [] }))).toBeNull()
    expect(
      parseClipboard(JSON.stringify({ type: CLIPBOARD_MIME, nodes: [{ id: 1 }], edges: [] }))
    ).toBeNull()
  })
})
