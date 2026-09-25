import { describe, expect, it } from 'vitest'
import { UML_DIAGRAM_TYPES } from '@/core/schemas/diagram.schema'
import { MERMAID_TEMPLATES, mermaidTemplate, supportsMermaid } from '../templates'

describe('Mermaid templates', () => {
  it('covers sequence, class, state, activity and use case only', () => {
    expect(UML_DIAGRAM_TYPES.filter(supportsMermaid)).toEqual([
      'class',
      'usecase',
      'activity',
      'state',
      'sequence'
    ])
    expect(mermaidTemplate('deployment')).toBeNull()
  })

  it('starts the sequence diagram with the starter actors', () => {
    expect(MERMAID_TEMPLATES.sequence).toContain('participant Engine as SOAR Engine')
    expect(MERMAID_TEMPLATES.sequence).toContain('SIEM ->> Engine: alert')
  })

  it('draws activity and use case diagrams as flowcharts', () => {
    expect(MERMAID_TEMPLATES.activity.startsWith('flowchart')).toBe(true)
    expect(MERMAID_TEMPLATES.usecase.startsWith('flowchart')).toBe(true)
  })
})
