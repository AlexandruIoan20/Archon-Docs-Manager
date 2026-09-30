import type { ShortcutId } from '@/core/constants/shortcuts'
import type { IconName } from '@/shared/components/icons'
import type { AlignMode, DistributeAxis } from '../utils/align'
import type { LayoutDirection } from '../utils/auto-layout'

export interface LayoutCommand<T> {
  value: T
  label: string
  icon: IconName
  shortcut?: ShortcutId
}

/** Align the selection: the panel's buttons, the node menu and the shortcuts. */
export const ALIGN_COMMANDS: readonly LayoutCommand<AlignMode>[] = [
  { value: 'left', label: 'Align left', icon: 'alignLeft', shortcut: 'diagram.align.left' },
  {
    value: 'center',
    label: 'Align centres',
    icon: 'alignCenter',
    shortcut: 'diagram.align.center'
  },
  { value: 'right', label: 'Align right', icon: 'alignRight', shortcut: 'diagram.align.right' },
  { value: 'top', label: 'Align top', icon: 'alignTop', shortcut: 'diagram.align.top' },
  {
    value: 'middle',
    label: 'Align middles',
    icon: 'alignMiddle',
    shortcut: 'diagram.align.middle'
  },
  { value: 'bottom', label: 'Align bottom', icon: 'alignBottom', shortcut: 'diagram.align.bottom' }
]

/** Distribute three or more selected nodes. */
export const DISTRIBUTE_COMMANDS: readonly LayoutCommand<DistributeAxis>[] = [
  {
    value: 'horizontal',
    label: 'Distribute horizontally',
    icon: 'distributeH',
    shortcut: 'diagram.distribute.horizontal'
  },
  {
    value: 'vertical',
    label: 'Distribute vertically',
    icon: 'distributeV',
    shortcut: 'diagram.distribute.vertical'
  }
]

/** Arrange the diagram (or the selection) in layers. */
export const ARRANGE_COMMANDS: readonly LayoutCommand<LayoutDirection>[] = [
  { value: 'TB', label: 'Top to bottom', icon: 'hierarchy', shortcut: 'diagram.arrange' },
  { value: 'LR', label: 'Left to right', icon: 'flow' }
]
