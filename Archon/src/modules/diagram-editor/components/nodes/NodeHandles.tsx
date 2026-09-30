import { Handle } from '@xyflow/react'
import { HANDLE_SIDES } from '../../utils/edge-handles'

/**
 * One handle per side. They are all sources: the canvas connects in loose
 * mode, so an edge can start or end on any side. The handles stay invisible
 * until the node is hovered or the connect tool is active (`node-chrome.css`).
 */
export function NodeHandles(): React.JSX.Element {
  return (
    <>
      {HANDLE_SIDES.map((side) => (
        <Handle key={side} id={side} type="source" position={side} className="ar-handle" />
      ))}
    </>
  )
}
