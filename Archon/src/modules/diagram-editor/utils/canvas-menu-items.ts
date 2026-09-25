import type { DiagramNodeType } from '@/core/types'
import type { ShortcutId } from '@/core/constants/shortcuts'
import type { ContextMenuEntry } from '@/shared/components/ui'
import { NODE_KINDS } from '../constants/node-kinds'
import { PLACEABLE_KINDS } from '../constants/tools'
import type { FlowNode } from './graph-mapping'
import { isFreeForm } from './node-factory'

export interface CanvasMenuActions {
  addNode: (type: DiagramNodeType) => void
  paste: () => void
  fitView: () => void
  resetZoom: () => void
  /** A registry shortcut as shown (`⌘V`, `Ctrl+V`). */
  keys: (id: ShortcutId) => string
}

/** Right click on the empty canvas: add a node there, paste, fit, reset zoom. */
export function canvasMenuItems(actions: CanvasMenuActions): ContextMenuEntry[] {
  return [
    ...PLACEABLE_KINDS.map((type): ContextMenuEntry => ({
      label: `Add ${NODE_KINDS[type].label} here`,
      icon: NODE_KINDS[type].defaultIcon,
      onSelect: () => actions.addNode(type)
    })),
    { type: 'separator' },
    { label: 'Paste', suffix: actions.keys('diagram.paste'), onSelect: actions.paste },
    { type: 'separator' },
    { label: 'Fit view', onSelect: actions.fitView },
    { label: 'Reset zoom', onSelect: actions.resetZoom }
  ]
}

export interface NodeMenuActions {
  duplicate: () => void
  copy: () => void
  copyId: (id: string) => void
  changeType: (id: string, type: DiagramNodeType) => void
  remove: () => void
  keys: (id: ShortcutId) => string
}

/** Types a SOAR node can turn into. */
const NODE_TYPES: readonly DiagramNodeType[] = [...PLACEABLE_KINDS, 'element']

/** Right click on a node: duplicate, copy, copy id, change type ▸, delete. */
export function nodeMenuItems(node: FlowNode, actions: NodeMenuActions): ContextMenuEntry[] {
  const changeType: ContextMenuEntry[] = isFreeForm(node.type)
    ? []
    : [
        {
          type: 'submenu',
          label: 'Change type',
          items: NODE_TYPES.map((type) => ({
            label: NODE_KINDS[type].label,
            icon: NODE_KINDS[type].defaultIcon,
            disabled: type === node.type,
            onSelect: () => actions.changeType(node.id, type)
          }))
        }
      ]
  return [
    { label: 'Duplicate', suffix: actions.keys('diagram.duplicate'), onSelect: actions.duplicate },
    { label: 'Copy', suffix: actions.keys('diagram.copy'), onSelect: actions.copy },
    { label: 'Copy id', suffix: node.id, onSelect: () => actions.copyId(node.id) },
    ...changeType,
    { type: 'separator' },
    {
      label: 'Delete',
      icon: 'trash',
      danger: true,
      suffix: actions.keys('diagram.delete'),
      onSelect: actions.remove
    }
  ]
}
