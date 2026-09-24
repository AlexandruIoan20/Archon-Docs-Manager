import { useShallow } from 'zustand/react/shallow'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import { isFreeForm, type StyleDefaults } from '../../utils/node-factory'

/**
 * The style the controls show: that of the first selected shape, text or edge,
 * or the defaults for the next shape when nothing styleable is selected.
 */
export function useStyleValues(): StyleDefaults {
  return useDiagramStore(
    useShallow((state): StyleDefaults => {
      const defaults = state.styleDefaults
      const node = state.nodes.find((n) => n.selected && isFreeForm(n.type))
      if (node) {
        return {
          stroke: node.data.stroke ?? defaults.stroke,
          fill: node.data.fill,
          strokeWidth: node.data.strokeWidth ?? defaults.strokeWidth,
          fontSize: node.data.fontSize ?? defaults.fontSize
        }
      }
      const data = state.edges.find((e) => e.selected)?.data
      if (data) {
        return {
          ...defaults,
          stroke: typeof data.stroke === 'string' ? data.stroke : defaults.stroke,
          strokeWidth:
            typeof data.strokeWidth === 'number' ? data.strokeWidth : defaults.strokeWidth
        }
      }
      return defaults
    })
  )
}
