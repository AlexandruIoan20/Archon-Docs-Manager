import type { ReactNode } from 'react'
import { useDiagramStore } from '../../store/DiagramStoreProvider'

/** Exposes the active tool as `data-tool`, which picks the canvas cursor in CSS. */
export function ToolCursor({ children }: { children: ReactNode }): React.JSX.Element {
  const tool = useDiagramStore((s) => s.tool)
  return (
    <div data-tool={tool} className="contents">
      {children}
    </div>
  )
}
