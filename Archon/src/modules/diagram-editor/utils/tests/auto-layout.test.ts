import type { XYPosition } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { arrange, arrangeable } from '../auto-layout'
import type { FlowEdge, FlowNode } from '../graph-mapping'

const node = (id: string, x: number, y: number, type: FlowNode['type'] = 'action'): FlowNode => ({
  id,
  type,
  position: { x, y },
  data: {} as FlowNode['data']
})
const edge = (id: string, source: string, target: string): FlowEdge => ({
  id,
  source,
  target,
  type: 'soar'
})

// Alert → Enrich → Decide, drawn in a messy row, plus a retry back to Enrich.
const NODES = [node('N1', 500, 40), node('N2', 0, 0), node('N3', 250, 300, 'decision')]
const EDGES = [edge('E1', 'N1', 'N2'), edge('E2', 'N2', 'N3'), edge('E3', 'N3', 'N2')]

describe('arrange', () => {
  it('stacks the flow top to bottom from where the nodes were', () => {
    const { moves } = arrange(NODES, EDGES, 'TB')
    const at = (id: string): XYPosition => moves.get(id) ?? NODES.find((n) => n.id === id)!.position
    expect(at('N1').y).toBeLessThan(at('N2').y)
    expect(at('N2').y).toBeLessThan(at('N3').y)
    // The top-left of the arrangement stays at the old top-left (0, 0).
    expect(Math.min(...['N1', 'N2', 'N3'].map((id) => at(id).x))).toBe(0)
    expect(Math.min(...['N1', 'N2', 'N3'].map((id) => at(id).y))).toBe(0)
  })

  it('turns edges down the flow, and back edges up', () => {
    const { handles } = arrange(NODES, EDGES, 'TB')
    expect(handles.get('E1')).toEqual({ sourceHandle: 'bottom', targetHandle: 'top' })
    expect(handles.get('E3')).toEqual({ sourceHandle: 'top', targetHandle: 'bottom' })
    expect(arrange(NODES, EDGES, 'LR').handles.get('E2')).toEqual({
      sourceHandle: 'right',
      targetHandle: 'left'
    })
  })

  it('leaves loose shapes and notes where they are', () => {
    const note = node('T1', 900, 900, 'text')
    expect(arrangeable([...NODES, note], EDGES).map((n) => n.id)).toEqual(['N1', 'N2', 'N3'])
  })
})
