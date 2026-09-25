import type { DiagramEdge, DiagramNode } from '@/core/types'
import { nameAttr, ownedComment, xmiId } from './xmi-writer'

/** One state machine with one region: nodes as states, edges as external transitions. */
export function stateXmi(
  title: string,
  nodes: readonly DiagramNode[],
  edges: readonly DiagramEdge[]
): string {
  const lines = [
    `    <packagedElement xmi:type="uml:StateMachine" xmi:id="_stateMachine"${nameAttr(title)}>`,
    `      <region xmi:type="uml:Region" xmi:id="_region">`
  ]
  for (const node of nodes) {
    const comment = ownedComment(node, '          ')
    const open = `        <subvertex xmi:type="uml:State" xmi:id="${xmiId(node.id)}"${nameAttr(node.data.label)}`
    lines.push(comment ? `${open}>${comment}\n        </subvertex>` : `${open}/>`)
  }
  for (const edge of edges) {
    lines.push(
      `        <transition xmi:type="uml:Transition" xmi:id="${xmiId(edge.id)}"${nameAttr(edge.label)} kind="external" source="${xmiId(edge.source)}" target="${xmiId(edge.target)}"/>`
    )
  }
  lines.push('      </region>', '    </packagedElement>')
  return lines.join('\n')
}
