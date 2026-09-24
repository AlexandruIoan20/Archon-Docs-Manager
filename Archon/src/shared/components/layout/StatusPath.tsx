import { useElementSize } from '@/shared/hooks/useElementSize'
import { truncateMiddle } from '@/shared/utils/truncate-middle'
import { StatusSegment } from './StatusSegment'

export interface StatusPathProps {
  /** Workspace-relative path of the active file; `undefined` when nothing is open. */
  path?: string
}

// JetBrains Mono advances 0.6em per glyph; the status bar text is 11px.
const MONO_CHAR_WIDTH = 11 * 0.6

/** The active file path, shortened in the middle so the file name stays visible. */
export function StatusPath({ path }: StatusPathProps): React.JSX.Element {
  const [ref, { width }] = useElementSize<HTMLSpanElement>()

  if (!path) {
    return (
      <StatusSegment grow>
        <span className="truncate">No file open</span>
      </StatusSegment>
    )
  }

  // Unmeasured (0) means "show everything"; CSS still clips it.
  const maxChars = width > 0 ? Math.floor(width / MONO_CHAR_WIDTH) : path.length
  const shown = truncateMiddle(path, maxChars)

  return (
    <StatusSegment grow mono title={path}>
      <span ref={ref} data-testid="status-path" className="block min-w-0 flex-auto overflow-hidden">
        {shown}
      </span>
    </StatusSegment>
  )
}
