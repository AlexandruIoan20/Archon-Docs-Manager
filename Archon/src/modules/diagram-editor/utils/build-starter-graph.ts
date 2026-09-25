import type { DiagramEdgeInput, DiagramNodeInput, UmlDiagramType } from '@/core/types'
import { catalogEntry } from '../constants/diagram-catalog'
import { STARTERS, type StarterNode } from '../constants/diagram-starters'

export const STARTER_ORIGIN = { x: 180, y: 260 } as const
export const STARTER_STEP = { x: 300, y: 70 } as const

function fallback(type: UmlDiagramType): readonly [StarterNode, StarterNode] {
  const { name, icon } = catalogEntry(type)
  return [
    { type: 'element', data: { label: `${name} A`, icon } },
    { type: 'element', data: { label: `${name} B`, icon } }
  ]
}

/** The nodes N1, N2 of a new diagram, placed on a diagonal, with the edge N1 → N2. */
export function buildStarterGraph(type: UmlDiagramType): {
  nodes: DiagramNodeInput[]
  edges: DiagramEdgeInput[]
} {
  const starters = STARTERS[type] ?? fallback(type)
  const nodes = starters.map((starter, i): DiagramNodeInput => ({
    id: `N${i + 1}`,
    type: starter.type,
    position: {
      x: STARTER_ORIGIN.x + i * STARTER_STEP.x,
      y: STARTER_ORIGIN.y + i * STARTER_STEP.y
    },
    data: { ...starter.data }
  }))
  return { nodes, edges: [{ id: 'E1', source: 'N1', target: 'N2' }] }
}
