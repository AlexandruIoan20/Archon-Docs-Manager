import type { DiagramNodeType } from '@/core/types'
import type { IconName } from '@/shared/components/icons'
import { NODE_COLORS } from './node-palette'

export interface NodeKind {
  label: string
  defaultIcon: IconName
  defaultColor: string
  shape: 'rect' | 'diamond'
  size: { width: number; height: number }
  supportsRetry: boolean
}

const RECT = { width: 176, height: 64 }
const DIAMOND = { width: 100, height: 100 }
const SHAPE = { width: 160, height: 96 }
const TEXT = { width: 140, height: 32 }

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
  }
}

/** The node's own color, or its kind's default. */
export function nodeColor(type: DiagramNodeType | undefined, color: string | null): string {
  return color ?? NODE_KINDS[type ?? 'element'].defaultColor
}
