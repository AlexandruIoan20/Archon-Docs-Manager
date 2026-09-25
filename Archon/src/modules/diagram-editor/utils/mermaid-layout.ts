export type MermaidLayout = 'row' | 'column' | 'single'

/** Side by side from 760px, stacked below, one pane at a time under 480px. */
export function mermaidLayout(width: number): MermaidLayout {
  // Not measured yet (first frame, tests): the wide layout.
  if (width === 0 || width >= 760) return 'row'
  return width >= 480 ? 'column' : 'single'
}
