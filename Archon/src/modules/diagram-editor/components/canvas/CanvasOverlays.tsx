import { useState } from 'react'
import { toolHint } from '../../constants/tools'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import { HINT_RAISE_BELOW, MINIMAP_MIN } from '../../utils/canvas-layout'
import { CanvasHint } from './CanvasHint'
import { CanvasMinimap } from './CanvasMinimap'
import { ZoomControls } from './ZoomControls'

export interface CanvasOverlaysProps {
  width: number
  height: number
}

/** Zoom controls, minimap and hint, laid out for the canvas size. */
export function CanvasOverlays({ width, height }: CanvasOverlaysProps): React.JSX.Element {
  const [forceMinimap, setForceMinimap] = useState(false)
  const hint = useDiagramStore((s) => toolHint(s.tool, s.connectFrom))
  // Unmeasured (0) counts as roomy: the first frame must not flash a layout change.
  const cramped =
    width > 0 && height > 0 && (width < MINIMAP_MIN.width || height < MINIMAP_MIN.height)
  const showMinimap = !cramped || forceMinimap

  return (
    <>
      <ZoomControls
        minimapToggle={
          cramped
            ? { shown: forceMinimap, onToggle: () => setForceMinimap((value) => !value) }
            : undefined
        }
      />
      {showMinimap && <CanvasMinimap />}
      <CanvasHint text={hint} raised={width > 0 && width < HINT_RAISE_BELOW} />
    </>
  )
}
