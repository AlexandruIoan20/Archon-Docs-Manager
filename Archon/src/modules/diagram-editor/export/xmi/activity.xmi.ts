import type { DiagramEdge, DiagramNode } from '@/core/types'
import { nameAttr, ownedComment, xmiId } from './xmi-writer'

function nodeType(node: DiagramNode): string {
  if (node.type === 'decision') return 'uml:DecisionNode'
  if (node.type === 'trigger') return 'uml:InitialNode'
  return 'uml:OpaqueAction'
}

const refs = (edges: readonly DiagramEdge[]): string => edges.map((e) => xmiId(e.id)).join(' ')

/** One activity: actions (decisions, a trigger as the initial node) joined by control flows. */
export function activityXmi(
  title: string,
  nodes: readonly DiagramNode[],
  edges: readonly DiagramEdge[]
): string {
  const lines = [
    `    <packagedElement xmi:type="uml:Activity" xmi:id="_activity"${nameAttr(title)}>`
  ]
  for (const node of nodes) {
    const outgoing = edges.filter((e) => e.source === node.id)
    const incoming = edges.filter((e) => e.target === node.id)
    const links =
      (outgoing.length ? ` outgoing="${refs(outgoing)}"` : '') +
      (incoming.length ? ` incoming="${refs(incoming)}"` : '')
    const comment = ownedComment(node, '        ')
    const open = `      <node xmi:type="${nodeType(node)}" xmi:id="${xmiId(node.id)}"${nameAttr(node.data.label)}${links}`
    lines.push(comment ? `${open}>${comment}\n      </node>` : `${open}/>`)
  }
  for (const edge of edges) {
    lines.push(
      `      <edge xmi:type="uml:ControlFlow" xmi:id="${xmiId(edge.id)}"${nameAttr(edge.label)} source="${xmiId(edge.source)}" target="${xmiId(edge.target)}"/>`
    )
  }
  lines.push('    </packagedElement>')
  return lines.join('\n')
}
