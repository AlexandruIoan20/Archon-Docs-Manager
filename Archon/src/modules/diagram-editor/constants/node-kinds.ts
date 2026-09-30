import type { DiagramNodeType } from '@/core/types'
import { ICON_PATHS, type IconName } from '@/shared/components/icons'
import { C4_COLORS, NODE_COLORS } from './node-palette'

export interface NodeKind {
  label: string
  defaultIcon: IconName
  defaultColor: string
  shape: 'rect' | 'diamond' | 'person' | 'cylinder' | 'boundary'
  size: { width: number; height: number }
  supportsRetry: boolean
}

const RECT = { width: 176, height: 64 }
const DIAMOND = { width: 100, height: 100 }
const SHAPE = { width: 160, height: 96 }
const TEXT = { width: 140, height: 32 }
const C4_BOX = { width: 220, height: 128 }
const C4_PERSON = { width: 200, height: 156 }
const C4_BOUNDARY = { width: 520, height: 320 }

const c4 = (
  label: string,
  defaultIcon: IconName,
  defaultColor: string,
  shape: NodeKind['shape'] = 'rect',
  size = C4_BOX
): NodeKind => ({ label, defaultIcon, defaultColor, shape, size, supportsRetry: false })

/** What each node type looks like by default. */
export const NODE_KINDS: Record<DiagramNodeType, NodeKind> = {
  trigger: {
    label: 'Trigger',
    defaultIcon: 'zap',
    defaultColor: NODE_COLORS.violet,
    shape: 'rect',
    size: RECT,
    supportsRetry: false
  },
  action: {
    label: 'Action',
    defaultIcon: 'play',
    defaultColor: NODE_COLORS.blue,
    shape: 'rect',
    size: RECT,
    supportsRetry: true
  },
  decision: {
    label: 'Decision',
    defaultIcon: 'branch',
    defaultColor: NODE_COLORS.amber,
    shape: 'diamond',
    size: DIAMOND,
    supportsRetry: false
  },
  integration: {
    label: 'Integration',
    defaultIcon: 'link',
    defaultColor: NODE_COLORS.green,
    shape: 'rect',
    size: RECT,
    supportsRetry: true
  },
  element: {
    label: 'Element',
    defaultIcon: 'box',
    defaultColor: NODE_COLORS.blue,
    shape: 'rect',
    size: RECT,
    supportsRetry: false
  },
  'shape-rect': {
    label: 'Rectangle',
    defaultIcon: 'rect',
    defaultColor: NODE_COLORS.neutral,
    shape: 'rect',
    size: SHAPE,
    supportsRetry: false
  },
  'shape-ellipse': {
    label: 'Ellipse',
    defaultIcon: 'circle',
    defaultColor: NODE_COLORS.neutral,
    shape: 'rect',
    size: SHAPE,
    supportsRetry: false
  },
  text: {
    label: 'Text',
    defaultIcon: 'text',
    defaultColor: NODE_COLORS.neutral,
    shape: 'rect',
    size: TEXT,
    supportsRetry: false
  },
  'c4-person': c4('Person', 'user', C4_COLORS.person, 'person', C4_PERSON),
  'c4-system': c4('Software System', 'server', C4_COLORS.system),
  'c4-container': c4('Container', 'box', C4_COLORS.container),
  'c4-database': c4('Database', 'database', C4_COLORS.container, 'cylinder'),
  'c4-component': c4('Component', 'component', C4_COLORS.component),
  'c4-boundary': c4('Boundary', 'boundary', C4_COLORS.boundary, 'boundary', C4_BOUNDARY)
}

/** C4 model nodes: drawn by `C4Node`, described by a type line and a description. */
export const isC4 = (type: DiagramNodeType | undefined): boolean =>
  type !== undefined && type.startsWith('c4-')

/** C4 people and systems outside the scope are grey unless they have a color of their own. */
const EXTERNAL_CAPABLE: ReadonlySet<DiagramNodeType> = new Set([
  'c4-person',
  'c4-system',
  'c4-container',
  'c4-database',
  'c4-component'
])

export const canBeExternal = (type: DiagramNodeType | undefined): boolean =>
  type !== undefined && EXTERNAL_CAPABLE.has(type)

/** The node's own color, or its kind's default (grey for an external C4 element). */
export function nodeColor(
  type: DiagramNodeType | undefined,
  color: string | null,
  external = false
): string {
  if (color) return color
  if (external && canBeExternal(type)) return C4_COLORS.external
  return NODE_KINDS[type ?? 'element'].defaultColor
}

const isIconName = (name: string | null): name is IconName => name !== null && name in ICON_PATHS

/** The node's own icon, or its kind's default. */
export function nodeIcon(type: DiagramNodeType | undefined, icon: string | null): IconName {
  return isIconName(icon) ? icon : (NODE_KINDS[type ?? 'element'] ?? NODE_KINDS.element).defaultIcon
}
