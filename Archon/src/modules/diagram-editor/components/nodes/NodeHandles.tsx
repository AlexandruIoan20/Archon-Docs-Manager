import { Handle, Position } from '@xyflow/react'

/**
 * Edges leave a node on the right and enter on the left. The handles stay
 * invisible until the node is hovered or the connect tool is active (`nodes.css`).
 */
export function NodeHandles(): React.JSX.Element {
  return (
    <>
      <Handle type="target" position={Position.Left} className="soar-handle" />
      <Handle type="source" position={Position.Right} className="soar-handle" />
    </>
  )
}
