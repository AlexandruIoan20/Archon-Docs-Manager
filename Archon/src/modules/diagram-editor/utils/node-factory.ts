import type { XYPosition } from '@xyflow/react'
import type { DiagramNodeType } from '@/core/types'
import { diagramNodeDataSchema } from '@/core/schemas/diagram.schema'
import { NODE_KINDS } from '../constants/node-kinds'
import type { FlowEdge, FlowNode } from './graph-mapping'

export interface StyleDefaults {
  stroke: string
  fill: string | null
  strokeWidth: number
  fontSize: number
}

/** `N1`, `N2`…: the smallest number not taken (ids stay short in the UI). */
export function nextId(prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  let k = 1
  while (used.has(`${prefix}${k}`)) k++
  return `${prefix}${k}`
}

const FREE_FORM: ReadonlySet<DiagramNodeType> = new Set(['shape-rect', 'shape-ellipse', 'text'])

/** Shapes and free text carry their own style and size; SOAR nodes use their kind's. */
export const isFreeForm = (type: DiagramNodeType | undefined): boolean =>
  type !== undefined && FREE_FORM.has(type)

/** A new node centred on `center`, selected, with defaults for its type. */
export function createNode(
  type: DiagramNodeType,
  center: XYPosition,
  existing: readonly FlowNode[],
  style: StyleDefaults
): FlowNode {
  const kind = NODE_KINDS[type]
  const { width, height } = kind.size
  const freeForm = isFreeForm(type)
  const data = diagramNodeDataSchema.parse({
    label: type === 'text' ? 'Text' : freeForm ? '' : kind.label,
    ...(freeForm
      ? {
          stroke: style.stroke,
          fill: style.fill,
          strokeWidth: style.strokeWidth,
          fontSize: style.fontSize
        }
      : {})
  })
  return {
    id: nextId(
      'N',
      existing.map((node) => node.id)
    ),
    type,
    position: { x: Math.round(center.x - width / 2), y: Math.round(center.y - height / 2) },
    data,
    selected: true,
    // Resizable nodes keep their size in the file; SOAR nodes have a fixed one.
    ...(freeForm ? { width, height } : {})
  }
}

/** A SOAR edge between two nodes, or `null` for a loop or a duplicate. */
export function createEdge(
  source: string,
  target: string,
  existing: readonly FlowEdge[]
): FlowEdge | null {
  if (source === target) return null
  if (existing.some((edge) => edge.source === source && edge.target === target)) return null
  return {
    id: nextId(
      'E',
      existing.map((edge) => edge.id)
    ),
    source,
    target,
    type: 'soar'
  }
}
