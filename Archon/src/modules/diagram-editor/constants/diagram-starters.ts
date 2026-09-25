import type { DiagramNodeType, UmlDiagramType } from '@/core/types'
import type { FlowNodeData } from '../utils/graph-mapping'

export interface StarterNode {
  type: DiagramNodeType
  data: Partial<FlowNodeData>
}

const element = (label: string, subtitle: string, icon: string): StarterNode => ({
  type: 'element',
  data: { label, subtitle, icon }
})

/** The two nodes a new diagram starts with; other types get „<Type> A” / „<Type> B”. */
export const STARTERS: Partial<Record<UmlDiagramType, readonly [StarterNode, StarterNode]>> = {
  class: [element('Alert', '«class»', 'box'), element('Indicator', '«class»', 'box')],
  sequence: [element('SIEM', 'lifeline', 'list'), element('SOAR Engine', 'lifeline', 'list')],
  state: [element('New', 'state', 'branch'), element('Contained', 'state', 'branch')],
  usecase: [element('Analyst', 'actor', 'circle'), element('Triage alert', 'use case', 'circle')],
  activity: [
    element('Receive alert', 'action', 'play'),
    element('Enrich indicators', 'action', 'play')
  ]
}
