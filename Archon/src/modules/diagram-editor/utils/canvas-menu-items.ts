import type { DiagramNodeType } from '@/core/types'
import type { ShortcutId } from '@/core/constants/shortcuts'
import type { ContextMenuEntry } from '@/shared/components/ui'
import { ALIGN_COMMANDS, ARRANGE_COMMANDS, type LayoutCommand } from '../constants/layout-commands'
import { isC4, NODE_KINDS } from '../constants/node-kinds'
import { C4_KINDS, PLACEABLE_KINDS, type PlaceableKind } from '../constants/tools'
import type { AlignMode } from './align'
import type { LayoutDirection } from './auto-layout'
import type { FlowNode } from './graph-mapping'
import { isFreeForm } from './node-factory'

/** A submenu running one of `commands`. */
function commandMenu<T>(
  label: string,
  icon: LayoutCommand<T>['icon'],
  commands: readonly LayoutCommand<T>[],
  run: (value: T) => void,
  keys: (id: ShortcutId) => string
): ContextMenuEntry {
  return {
    type: 'submenu',
    label,
    icon,
    items: commands.map((command) => ({
      label: command.label,
      icon: command.icon,
      suffix: command.shortcut ? keys(command.shortcut) : undefined,
      onSelect: () => run(command.value)
    }))
  }
}

export interface CanvasMenuActions {
  /** What can be added here: the SOAR nodes, or C4 elements in a C4 diagram. */
  kinds: readonly PlaceableKind[]
  addNode: (type: DiagramNodeType) => void
  paste: () => void
  arrange: (direction: LayoutDirection) => void
  fitView: () => void
  resetZoom: () => void
  /** A registry shortcut as shown (`⌘V`, `Ctrl+V`). */
  keys: (id: ShortcutId) => string
}

/** Right click on the empty canvas: add a node there, paste, arrange, fit, reset zoom. */
export function canvasMenuItems(actions: CanvasMenuActions): ContextMenuEntry[] {
  return [
    ...actions.kinds.map((type): ContextMenuEntry => ({
      label: `Add ${NODE_KINDS[type].label} here`,
      icon: NODE_KINDS[type].defaultIcon,
      onSelect: () => actions.addNode(type)
    })),
    { type: 'separator' },
    { label: 'Paste', suffix: actions.keys('diagram.paste'), onSelect: actions.paste },
    { type: 'separator' },
    commandMenu('Arrange', 'hierarchy', ARRANGE_COMMANDS, actions.arrange, actions.keys),
    { label: 'Fit view', onSelect: actions.fitView },
    { label: 'Reset zoom', onSelect: actions.resetZoom }
  ]
}

export interface NodeMenuActions {
  duplicate: () => void
  copy: () => void
  copyId: (id: string) => void
  changeType: (id: string, type: DiagramNodeType) => void
  /** Offered when two or more nodes are selected. */
  align?: (mode: AlignMode) => void
  remove: () => void
  keys: (id: ShortcutId) => string
}

/** Types a SOAR node can turn into. */
const NODE_TYPES: readonly DiagramNodeType[] = [...PLACEABLE_KINDS, 'element']
/** Types a C4 element can turn into (a boundary frames, it does not turn). */
const C4_TYPES: readonly DiagramNodeType[] = C4_KINDS.filter((kind) => kind !== 'c4-boundary')

function convertibleTypes(type: DiagramNodeType | undefined): readonly DiagramNodeType[] {
  if (isFreeForm(type) || type === 'c4-boundary') return []
  return isC4(type) ? C4_TYPES : NODE_TYPES
}

/** Right click on a node: duplicate, copy, copy id, change type ▸, align ▸, delete. */
export function nodeMenuItems(node: FlowNode, actions: NodeMenuActions): ContextMenuEntry[] {
  const types = convertibleTypes(node.type)
  const changeType: ContextMenuEntry[] =
    types.length === 0
      ? []
      : [
          {
            type: 'submenu',
            label: 'Change type',
            items: types.map((type) => ({
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
    ...(actions.align
      ? [commandMenu('Align', 'alignLeft', ALIGN_COMMANDS, actions.align, actions.keys)]
      : []),
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
