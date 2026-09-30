import type { DiagramNodeType } from '@/core/types'
import type { FlowNodeData } from '../../utils/graph-mapping'

/**
 * The bracketed type line under a C4 element's name: `[Person]`,
 * `[External Software System]`, `[Container: Spring Boot]`. The subtitle
 * holds the technology; a boundary's subtitle names what it bounds.
 */
export function c4TypeLine(type: DiagramNodeType, data: FlowNodeData): string {
  const tech = data.subtitle.trim()
  const external = data.external ? 'External ' : ''
  switch (type) {
    case 'c4-person':
      return `[${external}Person]`
    case 'c4-system':
      return `[${external}Software System]`
    case 'c4-container':
    case 'c4-database':
      return tech ? `[${external}Container: ${tech}]` : `[${external}Container]`
    case 'c4-component':
      return tech ? `[${external}Component: ${tech}]` : `[${external}Component]`
    case 'c4-boundary':
      return `[${tech || 'Software System'}]`
    default:
      return ''
  }
}
