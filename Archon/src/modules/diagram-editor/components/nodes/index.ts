import type { NodeTypes } from '@xyflow/react'
import { BaseNode } from './BaseNode'
import { C4BoundaryNode } from './C4BoundaryNode'
import { C4Node } from './C4Node'
import { ShapeNode } from './ShapeNode'

// Thin aliases: every SOAR node draws through `BaseNode`, which reads its type
// (icon, color, diamond for decisions) from `NODE_KINDS`.
export const TriggerNode = BaseNode
export const ActionNode = BaseNode
export const DecisionNode = BaseNode
export const IntegrationNode = BaseNode
export const ElementNode = BaseNode
export { ShapeNode }
/** Free text is a shape without outline or handles. */
export const TextNode = ShapeNode

/** Defined once, outside components: a new object each render would remount every node. */
export const NODE_TYPES: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  decision: DecisionNode,
  integration: IntegrationNode,
  element: ElementNode,
  'shape-rect': ShapeNode,
  'shape-ellipse': ShapeNode,
  text: TextNode,
  'c4-person': C4Node,
  'c4-system': C4Node,
  'c4-container': C4Node,
  'c4-database': C4Node,
  'c4-component': C4Node,
  'c4-boundary': C4BoundaryNode
}
