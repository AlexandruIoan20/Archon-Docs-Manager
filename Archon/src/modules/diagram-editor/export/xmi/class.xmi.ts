import type { DiagramEdge, DiagramNode } from '@/core/types'
import { nameAttr, ownedComment, xmiId } from './xmi-writer'

/** Nodes as classes; edges as binary associations between them. */
export function classXmi(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): string {
  const classes = nodes.map((node) => {
    const comment = ownedComment(node, '      ')
    const open = `    <packagedElement xmi:type="uml:Class" xmi:id="${xmiId(node.id)}"${nameAttr(node.data.label)}`
    return comment ? `${open}>${comment}\n    </packagedElement>` : `${open}/>`
  })
  const associations = edges.map((edge) => {
    const id = xmiId(edge.id)
    return [
      `    <packagedElement xmi:type="uml:Association" xmi:id="${id}"${nameAttr(edge.label)} memberEnd="${id}_source ${id}_target">`,
      `      <ownedEnd xmi:type="uml:Property" xmi:id="${id}_source" type="${xmiId(edge.source)}" association="${id}"/>`,
      `      <ownedEnd xmi:type="uml:Property" xmi:id="${id}_target" type="${xmiId(edge.target)}" association="${id}"/>`,
      `    </packagedElement>`
    ].join('\n')
  })
  return [...classes, ...associations].join('\n')
}
