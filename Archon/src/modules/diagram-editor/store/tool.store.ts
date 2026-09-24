import { NODE_COLORS } from '../constants/node-palette'
import type { StyleDefaults } from '../utils/node-factory'
import type { SetState, ToolState } from './diagram-state'

export const DEFAULT_STYLE: StyleDefaults = {
  stroke: NODE_COLORS.neutral,
  fill: null,
  strokeWidth: 1.5,
  fontSize: 13
}

/** The tab's active tool, kept in the diagram store (one per tab, same registry). */
export function createToolSlice(set: SetState): ToolState {
  return {
    tool: 'select',
    nodeKind: 'action',
    connectFrom: null,
    styleDefaults: DEFAULT_STYLE,
    // Another tool always drops a half-made connection.
    setTool: (tool) => set({ tool, connectFrom: null }),
    setNodeKind: (nodeKind) => set({ nodeKind }),
    setConnectFrom: (connectFrom) => set({ connectFrom })
  }
}
