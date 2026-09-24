import { z } from 'zod'
import { isoDate } from './common.schema'

export const DIAGRAM_FORMAT_VERSION = '1.0.0'

/** The 14 UML 2.5 diagram types (catalog in plan 17). */
export const UML_DIAGRAM_TYPES = [
  'class',
  'object',
  'component',
  'composite',
  'package',
  'deployment',
  'profile',
  'usecase',
  'activity',
  'state',
  'sequence',
  'communication',
  'timing',
  'interaction'
] as const

export const DIAGRAM_TYPES = ['flowchart', ...UML_DIAGRAM_TYPES] as const

export const DIAGRAM_NODE_TYPES = [
  'trigger',
  'action',
  'decision',
  'integration',
  'element',
  'shape-rect',
  'shape-ellipse',
  'text'
] as const

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a #RRGGBB color')

export const diagramTypeSchema = z.enum(DIAGRAM_TYPES)
export const diagramEngineSchema = z.enum(['react-flow', 'mermaid'])
export const nodeStyleSchema = z.enum(['card', 'outline', 'solid'])
export const edgeStyleSchema = z.enum(['curved', 'orthogonal', 'straight'])

// Loose objects keep fields added by later versions instead of dropping them on save.
export const diagramNodeDataSchema = z.looseObject({
  label: z.string().default(''),
  subtitle: z.string().default(''),
  /** Semantic node color; `null` uses the node type's default. */
  color: hexColor.nullable().default(null),
  icon: z.string().nullable().default(null),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  retryOnFail: z.boolean().default(false),
  stroke: hexColor.nullable().default(null),
  fill: hexColor.nullable().default(null),
  strokeWidth: z.number().positive().nullable().default(null),
  fontSize: z.number().positive().nullable().default(null)
})

/** Same shape as a React Flow node (`id` / `type` / `position` / `data`). */
export const diagramNodeSchema = z.looseObject({
  /** Short and shown in the UI (`N1`, `N2`…); unique within the diagram. */
  id: z.string().min(1),
  type: z.enum(DIAGRAM_NODE_TYPES),
  position: z.object({ x: z.number(), y: z.number() }),
  data: diagramNodeDataSchema.prefault({})
})

export const diagramEdgeSchema = z.looseObject({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().nullable().default(null)
})

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive()
})

const uniqueIds = (items: readonly { id: string }[]): boolean =>
  new Set(items.map((item) => item.id)).size === items.length

export const diagramDataSchema = z.object({
  nodes: z.array(diagramNodeSchema).default([]).refine(uniqueIds, 'Node ids must be unique'),
  edges: z.array(diagramEdgeSchema).default([]).refine(uniqueIds, 'Edge ids must be unique'),
  viewport: viewportSchema.default({ x: 0, y: 0, zoom: 1 })
})

/** `.soardiag`: a diagram. */
export const diagramFileSchema = z.object({
  version: z.string().min(1),
  id: z.string().min(1),
  title: z.string().max(200),
  type: diagramTypeSchema.default('flowchart'),
  engine: diagramEngineSchema.default('react-flow'),
  created: isoDate,
  lastModified: isoDate,
  /** `null` fields follow the app preference. */
  style: z
    .object({
      nodeStyle: nodeStyleSchema.nullable().default(null),
      edgeStyle: edgeStyleSchema.nullable().default(null)
    })
    .prefault({}),
  data: diagramDataSchema.prefault({}),
  mermaidSource: z.string().nullable().default(null),
  exportedAt: isoDate.nullable().default(null),
  tags: z.array(z.string()).default([])
})
