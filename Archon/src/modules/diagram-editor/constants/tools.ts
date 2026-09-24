import type { DiagramNodeType } from '@/core/types'
import type { IconName } from '@/shared/components/icons'

export type DiagramTool = 'select' | 'pan' | 'node' | 'connect' | 'text' | 'rect' | 'ellipse'

/** Node types the Add node tool can place (its chevron menu). */
export type PlaceableKind = 'trigger' | 'action' | 'decision' | 'integration'

export interface ToolDef {
  id: DiagramTool
  label: string
  icon: IconName
  /** Single key, without modifiers. */
  shortcut: string
  /** `secondary` tools fold into the „⋯” menu in the minimal title bar. */
  priority: 'primary' | 'secondary'
}

export const TOOLS: readonly ToolDef[] = [
  { id: 'select', label: 'Select', icon: 'cursor', shortcut: 'V', priority: 'primary' },
  { id: 'pan', label: 'Pan', icon: 'hand', shortcut: 'H', priority: 'primary' },
  { id: 'node', label: 'Add node', icon: 'plusBox', shortcut: 'N', priority: 'primary' },
  { id: 'connect', label: 'Connect', icon: 'link', shortcut: 'C', priority: 'primary' },
  { id: 'text', label: 'Text', icon: 'text', shortcut: 'T', priority: 'secondary' },
  { id: 'rect', label: 'Rectangle', icon: 'rect', shortcut: 'R', priority: 'secondary' },
  { id: 'ellipse', label: 'Ellipse', icon: 'circle', shortcut: 'O', priority: 'secondary' }
]

export const PLACEABLE_KINDS: readonly PlaceableKind[] = [
  'trigger',
  'action',
  'decision',
  'integration'
]

/** The node type a click places with this tool, or `null` if the tool does not place. */
export function placedNodeType(tool: DiagramTool, kind: PlaceableKind): DiagramNodeType | null {
  switch (tool) {
    case 'node':
      return kind
    case 'text':
      return 'text'
    case 'rect':
      return 'shape-rect'
    case 'ellipse':
      return 'shape-ellipse'
    default:
      return null
  }
}

/** The pill at the bottom of the canvas. */
export function toolHint(tool: DiagramTool, connectFrom: string | null): string | undefined {
  switch (tool) {
    case 'node':
      return 'Click on the canvas to place a node'
    case 'connect':
      return connectFrom ? 'Now click the target node' : 'Click a source node to start an edge'
    case 'text':
      return 'Click on the canvas to place a text'
    case 'rect':
      return 'Click on the canvas to place a rectangle'
    case 'ellipse':
      return 'Click on the canvas to place an ellipse'
    default:
      return undefined
  }
}
