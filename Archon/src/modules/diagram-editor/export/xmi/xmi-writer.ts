import type { DiagramEdge, DiagramNode } from '@/core/types'
import { isFreeForm } from '../../utils/node-factory'

export const XMI_NAMESPACES = {
  xmi: 'http://www.omg.org/spec/XMI/20131001',
  uml: 'http://www.omg.org/spec/UML/20161101'
} as const

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** A node or edge id as an XMI id (an XML name: never starts with a digit). */
export const xmiId = (id: string): string => `_${id.replace(/[^\w.-]/g, '_')}`

/** `name="…"` when there is one. */
export const nameAttr = (name: string | null | undefined): string =>
  name ? ` name="${escapeXml(name)}"` : ''

/** The UML elements of the diagram: its nodes without free shapes and text, and their edges. */
export function umlGraph(
  nodes: readonly DiagramNode[],
  edges: readonly DiagramEdge[]
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const kept = nodes.filter((node) => !isFreeForm(node.type))
  const ids = new Set(kept.map((node) => node.id))
  return {
    nodes: kept,
    edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target))
  }
}

/** A node's description, as the UML comment it owns. */
export function ownedComment(node: DiagramNode, indent: string): string {
  const body = node.data.description
  if (!body) return ''
  return `\n${indent}<ownedComment xmi:type="uml:Comment" xmi:id="${xmiId(node.id)}_comment" body="${escapeXml(body)}"/>`
}

/** The XMI 2.5.1 document around a model's packaged elements. */
export function xmiDocument(modelName: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.5.1" xmlns:xmi="${XMI_NAMESPACES.xmi}" xmlns:uml="${XMI_NAMESPACES.uml}">
  <uml:Model xmi:type="uml:Model" xmi:id="_model"${nameAttr(modelName)}>
${body}
  </uml:Model>
</xmi:XMI>
`
}
