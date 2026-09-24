import { describe, expect, it } from 'vitest'
import type { FlowNode } from '../graph-mapping'
import { createEdge, createNode, nextId } from '../node-factory'
import { DEFAULT_STYLE } from '../../store/tool.store'

const at = (id: string): FlowNode =>
  ({ id, type: 'action', position: { x: 0, y: 0 }, data: {} }) as FlowNode

describe('node factory', () => {
  it('takes the smallest free id', () => {
    expect(nextId('N', [])).toBe('N1')
    expect(nextId('N', ['N1', 'N2', 'N4'])).toBe('N3')
  })

  it('centres a SOAR node on the click, sized by its type', () => {
    const node = createNode('action', { x: 300, y: 200 }, [at('N1')], DEFAULT_STYLE)
    expect(node).toMatchObject({
      id: 'N2',
      type: 'action',
      position: { x: 212, y: 168 },
      selected: true,
      data: { label: 'Action', stroke: null }
    })
    expect(node).not.toHaveProperty('width')
    const decision = createNode('decision', { x: 100, y: 100 }, [], DEFAULT_STYLE)
    expect(decision.position).toEqual({ x: 50, y: 50 })
  })

  it('gives shapes and text a size and the current style', () => {
    const style = { ...DEFAULT_STYLE, stroke: '#DC2626', fill: '#2563EB', fontSize: 18 }
    const shape = createNode('shape-rect', { x: 80, y: 48 }, [], style)
    expect(shape).toMatchObject({ width: 160, height: 96, position: { x: 0, y: 0 } })
    expect(shape.data).toMatchObject({
      label: '',
      stroke: '#DC2626',
      fill: '#2563EB',
      fontSize: 18
    })
    expect(createNode('text', { x: 0, y: 0 }, [], style).data.label).toBe('Text')
  })

  it('refuses loops and duplicate edges', () => {
    const edges = [{ id: 'E1', source: 'N1', target: 'N2' }]
    expect(createEdge('N1', 'N1', edges)).toBeNull()
    expect(createEdge('N1', 'N2', edges)).toBeNull()
    expect(createEdge('N2', 'N1', edges)).toEqual({
      id: 'E2',
      source: 'N2',
      target: 'N1',
      type: 'soar'
    })
  })
})
