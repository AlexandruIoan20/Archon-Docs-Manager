import type { DiagramType, ArchonDiagram } from '@/core/types'
import { activityXmi } from './activity.xmi'
import { classXmi } from './class.xmi'
import { stateXmi } from './state.xmi'
import { umlGraph, xmiDocument } from './xmi-writer'

export const XMI_DIAGRAM_TYPES = ['class', 'activity', 'state'] as const satisfies DiagramType[]

type XmiType = (typeof XMI_DIAGRAM_TYPES)[number]

/** Canvas diagrams of a type with an XMI mapping; a Mermaid diagram has no graph to map. */
export function supportsXmi(diagram: Pick<ArchonDiagram, 'type' | 'engine'>): boolean {
  return (
    diagram.engine !== 'mermaid' && (XMI_DIAGRAM_TYPES as readonly string[]).includes(diagram.type)
  )
}

/** The diagram as UML 2.5.1 XMI. */
export function serializeXmi(diagram: ArchonDiagram): string {
  if (!supportsXmi(diagram)) throw new Error('Not available for this diagram type')
  const { nodes, edges } = umlGraph(diagram.data.nodes, diagram.data.edges)
  const body: Record<XmiType, () => string> = {
    class: () => classXmi(nodes, edges),
    activity: () => activityXmi(diagram.title, nodes, edges),
    state: () => stateXmi(diagram.title, nodes, edges)
  }
  return xmiDocument(diagram.title, body[diagram.type as XmiType]())
}
