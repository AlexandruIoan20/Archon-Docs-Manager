import { createContext, useContext } from 'react'
import type { EdgeStyle, NodeStyle } from '@/core/types'

export interface DiagramStyle {
  nodeStyle: NodeStyle
  edgeStyle: EdgeStyle
  /** The connect tool is active (plan 15): handles show and nodes take a crosshair. */
  connecting: boolean
}

export const DEFAULT_DIAGRAM_STYLE: DiagramStyle = {
  nodeStyle: 'card',
  edgeStyle: 'curved',
  connecting: false
}

/** Provided by the canvas; read by node and edge components. */
export const DiagramStyleContext = createContext<DiagramStyle>(DEFAULT_DIAGRAM_STYLE)

export function useDiagramStyle(): DiagramStyle {
  return useContext(DiagramStyleContext)
}
