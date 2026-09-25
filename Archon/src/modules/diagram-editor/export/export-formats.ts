import type { ExportExtension, SoarDiagram } from '@/core/types'
import { supportsXmi } from './xmi/serialize-xmi'

export interface ExportFormat {
  id: ExportExtension
  label: string
  extension: `.${ExportExtension}`
  isAvailable: (diagram: Pick<SoarDiagram, 'type' | 'engine'>) => boolean
}

/** The Export menu, in order. */
export const EXPORT_FORMATS: readonly ExportFormat[] = [
  { id: 'png', label: 'PNG', extension: '.png', isAvailable: () => true },
  { id: 'svg', label: 'SVG', extension: '.svg', isAvailable: () => true },
  { id: 'pdf', label: 'PDF', extension: '.pdf', isAvailable: () => true },
  { id: 'xmi', label: 'UML XMI', extension: '.xmi', isAvailable: supportsXmi }
]
