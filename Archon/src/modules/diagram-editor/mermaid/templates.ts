import type { CatalogDiagramType } from '@/core/types'
import { STARTERS } from '../constants/diagram-starters'

type MermaidType =
  | 'sequence'
  | 'class'
  | 'state'
  | 'activity'
  | 'usecase'
  | 'c4-context'
  | 'c4-container'
  | 'c4-component'
  | 'c4-landscape'
  | 'c4-dynamic'
  | 'c4-deployment'

const label = (type: MermaidType, index: 0 | 1): string =>
  String(STARTERS[type]?.[index]?.data.label ?? '')

/**
 * The types Mermaid can draw, with the source a new text diagram starts from.
 * Activity and use case diagrams are drawn as flowcharts; C4 diagrams use
 * Mermaid's C4 syntax (a landscape is a context diagram with an enterprise).
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
`,
  'c4-context': `C4Context
    Person(analyst, "${label('c4-context', 0)}", "Triages and responds to alerts")
    System(soar, "${label('c4-context', 1)}", "Runs response playbooks")
    System_Ext(siem, "SIEM", "Sends security alerts")
    Rel(analyst, soar, "Uses")
    Rel(siem, soar, "Sends alerts to", "HTTPS")
`,
  'c4-container': `C4Container
    Person(analyst, "SOC Analyst")
    System_Boundary(soar, "SOAR Platform") {
      Container(engine, "${label('c4-container', 0)}", "Python", "Executes playbook steps")
      ContainerDb(cases, "${label('c4-container', 1)}", "PostgreSQL", "Incidents and evidence")
    }
    Rel(analyst, engine, "Uses")
    Rel(engine, cases, "Reads and writes", "SQL")
`,
  'c4-component': `C4Component
    Container_Boundary(engine, "Playbook Engine") {
      Component(ingest, "${label('c4-component', 0)}", "Kafka consumer", "Normalises incoming alerts")
      Component(enrich, "${label('c4-component', 1)}", "REST client", "Looks up indicators")
    }
    Rel(ingest, enrich, "Sends alerts to")
`,
  'c4-landscape': `C4Context
    Person(analyst, "${label('c4-landscape', 0)}", "Works the alert queue")
    Enterprise_Boundary(org, "Organisation") {
      System(siem, "${label('c4-landscape', 1)}", "Collects and correlates logs")
      System(soar, "SOAR Platform", "Runs response playbooks")
    }
    Rel(analyst, soar, "Uses")
    Rel(siem, soar, "Sends alerts to")
`,
  'c4-dynamic': `C4Dynamic
    Container(engine, "${label('c4-dynamic', 0)}", "Python")
    Container(edr, "${label('c4-dynamic', 1)}", "REST")
    Rel(engine, edr, "Isolate the host")
`,
  'c4-deployment': `C4Deployment
    Deployment_Node(k8s, "Kubernetes", "EKS") {
      Container(engine, "${label('c4-deployment', 0)}", "Docker")
    }
    Deployment_Node(rds, "Amazon RDS", "Managed") {
      ContainerDb(cases, "${label('c4-deployment', 1)}", "PostgreSQL")
    }
    Rel(engine, cases, "Reads and writes", "SQL")
`
}

export function supportsMermaid(type: CatalogDiagramType): type is MermaidType {
  return type in MERMAID_TEMPLATES
}

export function mermaidTemplate(type: CatalogDiagramType): string | null {
  return supportsMermaid(type) ? MERMAID_TEMPLATES[type] : null
}
