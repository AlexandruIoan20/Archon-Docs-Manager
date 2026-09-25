import type { UmlDiagramType } from '@/core/types'
import { STARTERS } from '../constants/diagram-starters'

type MermaidType = 'sequence' | 'class' | 'state' | 'activity' | 'usecase'

const label = (type: MermaidType, index: 0 | 1): string =>
  String(STARTERS[type]?.[index]?.data.label ?? '')

/**
 * The types Mermaid can draw, with the source a new text diagram starts from.
 * Activity and use case diagrams are drawn as flowcharts.
 */
export const MERMAID_TEMPLATES: Record<MermaidType, string> = {
  sequence: `sequenceDiagram
    participant SIEM as ${label('sequence', 0)}
    participant Engine as ${label('sequence', 1)}
    SIEM ->> Engine: alert
    Engine -->> SIEM: ack
`,
  class: `classDiagram
    class ${label('class', 0)} {
      +String id
      +severity()
    }
    class ${label('class', 1)} {
      +String value
    }
    ${label('class', 0)} "1" --> "*" ${label('class', 1)}
`,
  state: `stateDiagram-v2
    [*] --> ${label('state', 0)}
    ${label('state', 0)} --> ${label('state', 1)}: contain
    ${label('state', 1)} --> [*]
`,
  activity: `flowchart TD
    start((start)) --> receive[${label('activity', 0)}]
    receive --> enrich[${label('activity', 1)}]
    enrich --> done((end))
`,
  usecase: `flowchart LR
    analyst([${label('usecase', 0)}]) --> triage((${label('usecase', 1)}))
`
}

export function supportsMermaid(type: UmlDiagramType): type is MermaidType {
  return type in MERMAID_TEMPLATES
}

export function mermaidTemplate(type: UmlDiagramType): string | null {
  return supportsMermaid(type) ? MERMAID_TEMPLATES[type] : null
}
