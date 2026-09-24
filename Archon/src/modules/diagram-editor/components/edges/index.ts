import type { EdgeTypes } from '@xyflow/react'
import { SOAR_EDGE_TYPE } from '../../utils/graph-mapping'
import { SoarEdge } from './SoarEdge'

export { SOAR_EDGE_TYPE }

/** Defined once, outside components, like `NODE_TYPES`. */
export const EDGE_TYPES: EdgeTypes = { [SOAR_EDGE_TYPE]: SoarEdge }
