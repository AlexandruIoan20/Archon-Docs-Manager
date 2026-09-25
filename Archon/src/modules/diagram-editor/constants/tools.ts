import type { DiagramNodeType } from '@/core/types'
import { getShortcut, type ShortcutId } from '@/core/constants/shortcuts'
import type { IconName } from '@/shared/components/icons'

export type DiagramTool = 'select' | 'pan' | 'node' | 'connect' | 'text' | 'rect' | 'ellipse'

/** Node types the Add node tool can place (its chevron menu). */
export type PlaceableKind = 'trigger' | 'action' | 'decision' | 'integration'

export interface ToolDef {
  id: DiagramTool
  label: string
  icon: IconName
  /** Its entry in the shortcut registry. */
  shortcutId: ShortcutId
  /** The key shown in tooltips (from the registry). */
  shortcut: string
  /** `secondary` tools fold into the „⋯” menu in the minimal title bar. */
  priority: 'primary' | 'secondary'
}

const tool = (
  id: DiagramTool,
  label: string,
  icon: IconName,
  priority: ToolDef['priority']
): ToolDef => {
  const shortcutId = `diagram.tool.${id}` as ShortcutId
  const key = getShortcut(shortcutId).keys[0] ?? ''
  return { id, label, icon, shortcutId, shortcut: key.toUpperCase(), priority }
}

export const TOOLS: readonly ToolDef[] = [
  tool('select', 'Select', 'cursor', 'primary'),
  tool('pan', 'Pan', 'hand', 'primary'),
  tool('node', 'Add node', 'plusBox', 'primary'),
  tool('connect', 'Connect', 'link', 'primary'),
  tool('text', 'Text', 'text', 'secondary'),
  tool('rect', 'Rectangle', 'rect', 'secondary'),
  tool('ellipse', 'Ellipse', 'circle', 'secondary')
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
