import { describe, expect, it } from 'vitest'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { PHISHING } from '@/test/sample-diagram'
import { fileToGraph, graphToFile, isDefaultViewport } from '../graph-mapping'
import { stepZoom } from '../zoom'

describe('graph mapping', () => {
  it('round-trips a file without losing anything', () => {
    expect(graphToFile(fileToGraph(PHISHING))).toEqual(PHISHING)
  })

  it('maps edge labels to React Flow and back', () => {
    const { edges } = fileToGraph(PHISHING)
    expect(edges[0]).toMatchObject({ id: 'E1', label: 'yes' })
    expect(edges[1]).not.toHaveProperty('label')
  })

  it('leaves React Flow runtime state out of the file', () => {
    const graph = fileToGraph(PHISHING)
    const [first, ...rest] = graph.nodes
    graph.nodes = [
      { ...first!, selected: true, dragging: true, measured: { width: 176, height: 64 } },
      ...rest
    ]
    graph.edges = graph.edges.map((edge) => ({ ...edge, selected: true }))
    const file = graphToFile(graph)
    expect(file.data.nodes[0]).not.toHaveProperty('selected')
    expect(file.data.nodes[0]).not.toHaveProperty('measured')
    expect(file.data.edges[0]).not.toHaveProperty('selected')
    expect(diagramFileSchema.parse(file)).toEqual(PHISHING)
  })

  it('knows an untouched viewport', () => {
    expect(isDefaultViewport({ x: 0, y: 0, zoom: 1 })).toBe(true)
    expect(isDefaultViewport({ x: 0, y: 0, zoom: 0.87 })).toBe(false)
  })
})

describe('stepZoom', () => {
  it('moves in 10% steps within 30%–200%', () => {
    expect(stepZoom(1, 1)).toBe(1.1)
    expect(stepZoom(1, -1)).toBe(0.9)
    expect(stepZoom(0.87, 1)).toBe(0.9)
    expect(stepZoom(0.87, -1)).toBe(0.8)
    expect(stepZoom(0.3, -1)).toBe(0.3)
    expect(stepZoom(2, 1)).toBe(2)
    expect(stepZoom(1.95, 1)).toBe(2)
  })
})
