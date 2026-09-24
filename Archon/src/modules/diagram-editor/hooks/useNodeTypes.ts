import type { EdgeTypes, NodeTypes } from '@xyflow/react'
import type { EdgeStyle, NodeStyle } from '@/core/types'
import { useSettings } from '@/shared/hooks/useSettings'
import { EDGE_TYPES } from '../components/edges'
import { NODE_TYPES } from '../components/nodes'
import { DEFAULT_DIAGRAM_STYLE } from '../components/diagram-style'
import { useDiagramStore } from '../store/DiagramStoreProvider'

export interface NodeTypesAndStyle {
  nodeTypes: NodeTypes
  edgeTypes: EdgeTypes
  nodeStyle: NodeStyle
  edgeStyle: EdgeStyle
}

/**
 * The node and edge components, and the skins they draw with:
 * the diagram's own style → the app preference (plan 05) → the default.
 */
export function useNodeTypes(): NodeTypesAndStyle {
  const diagramNodeStyle = useDiagramStore((s) => s.meta.style?.nodeStyle ?? null)
  const diagramEdgeStyle = useDiagramStore((s) => s.meta.style?.edgeStyle ?? null)
  const { appearance } = useSettings()
  return {
    nodeTypes: NODE_TYPES,
    edgeTypes: EDGE_TYPES,
    nodeStyle: diagramNodeStyle ?? appearance.nodeStyle ?? DEFAULT_DIAGRAM_STYLE.nodeStyle,
    edgeStyle: diagramEdgeStyle ?? appearance.edgeStyle ?? DEFAULT_DIAGRAM_STYLE.edgeStyle
  }
}
