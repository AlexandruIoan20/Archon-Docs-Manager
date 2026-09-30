import type { z } from 'zod'
import type {
  CATALOG_DIAGRAM_TYPES,
  C4_DIAGRAM_TYPES,
  DIAGRAM_NODE_TYPES,
  UML_DIAGRAM_TYPES,
  diagramEdgeSchema,
  diagramEngineSchema,
  diagramFileSchema,
  diagramNodeSchema,
  diagramTypeSchema
} from '@/core/schemas/diagram.schema'

export type UmlDiagramType = (typeof UML_DIAGRAM_TYPES)[number]
export type C4DiagramType = (typeof C4_DIAGRAM_TYPES)[number]
/** A type the „New diagram” dialog offers (all but `flowchart`). */
export type CatalogDiagramType = (typeof CATALOG_DIAGRAM_TYPES)[number]
export type DiagramType = z.infer<typeof diagramTypeSchema>
export type DiagramEngine = z.infer<typeof diagramEngineSchema>
export type DiagramNodeType = (typeof DIAGRAM_NODE_TYPES)[number]

/** A `.ardiag` file as read from disk (defaults applied). */
export type ArchonDiagram = z.infer<typeof diagramFileSchema>
export type DiagramNode = z.infer<typeof diagramNodeSchema>
export type DiagramEdge = z.infer<typeof diagramEdgeSchema>
/** Nodes and edges as callers may pass them; missing fields get their defaults. */
export type DiagramNodeInput = z.input<typeof diagramNodeSchema>
export type DiagramEdgeInput = z.input<typeof diagramEdgeSchema>

export interface CreateDiagramOptions {
  type: DiagramType
  /** Also the base of the file name; defaults to `<type>-N`. */
  title?: string
  engine?: DiagramEngine
  nodes?: DiagramNodeInput[]
  edges?: DiagramEdgeInput[]
  /** The text of an `engine: 'mermaid'` diagram. */
  mermaidSource?: string
}
