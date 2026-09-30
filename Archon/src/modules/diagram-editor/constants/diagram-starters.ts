import type { DiagramNodeType, CatalogDiagramType } from '@/core/types'
import type { FlowNodeData } from '../utils/graph-mapping'

export interface StarterNode {
  type: DiagramNodeType
  data: Partial<FlowNodeData>
}

const element = (label: string, subtitle: string, icon: string): StarterNode => ({
  type: 'element',
  data: { label, subtitle, icon }
})

const c4 = (
  type: DiagramNodeType,
  label: string,
  description: string,
  subtitle = ''
): StarterNode => ({ type, data: { label, description, subtitle } })

/** The two nodes a new diagram starts with; other types get „<Type> A” / „<Type> B”. */
export const STARTERS: Partial<Record<CatalogDiagramType, readonly [StarterNode, StarterNode]>> = {
  class: [element('Alert', '«class»', 'box'), element('Indicator', '«class»', 'box')],
  sequence: [element('SIEM', 'lifeline', 'list'), element('SOAR Engine', 'lifeline', 'list')],
  state: [element('New', 'state', 'branch'), element('Contained', 'state', 'branch')],
  usecase: [element('Analyst', 'actor', 'circle'), element('Triage alert', 'use case', 'circle')],
  activity: [
    element('Receive alert', 'action', 'play'),
    element('Enrich indicators', 'action', 'play')
  ],
  'c4-context': [
    c4('c4-person', 'SOC Analyst', 'Triages and responds to alerts'),
    c4('c4-system', 'SOAR Platform', 'Runs response playbooks')
  ],
  'c4-container': [
    c4('c4-container', 'Playbook Engine', 'Executes playbook steps', 'Python'),
    c4('c4-database', 'Case Store', 'Incidents and evidence', 'PostgreSQL')
  ],
  'c4-component': [
    c4('c4-component', 'Alert Ingestor', 'Normalises incoming alerts', 'Kafka consumer'),
    c4('c4-component', 'Enrichment Service', 'Looks up indicators', 'REST client')
  ],
  'c4-landscape': [
    c4('c4-person', 'SOC Analyst', 'Works the alert queue'),
    c4('c4-system', 'SIEM', 'Collects and correlates logs')
  ],
  'c4-dynamic': [
    c4('c4-container', 'Playbook Engine', '1. Receives the alert', 'Python'),
    c4('c4-container', 'EDR Connector', '2. Isolates the host', 'REST')
  ],
  'c4-deployment': [
    c4('c4-container', 'Playbook Engine', 'Kubernetes pod', 'Docker'),
    c4('c4-database', 'Case Store', 'Managed database', 'PostgreSQL')
  ]
}
