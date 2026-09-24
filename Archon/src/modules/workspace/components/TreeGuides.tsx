export interface TreeGuidesProps {
  depth: number
}

export const TREE_INDENT = 14
export const TREE_PADDING = 6
const GUIDE_OFFSET = 13

/**
 * One vertical 1px line per ancestor level. Each spans the full row height,
 * so lines stay continuous across stacked rows.
 */
export function TreeGuides({ depth }: TreeGuidesProps): React.JSX.Element | null {
  if (depth === 0) return null
  return (
    <>
      {Array.from({ length: depth }, (_, level) => (
        <span
          key={level}
          aria-hidden
          data-testid="tree-guide"
          className="pointer-events-none absolute inset-y-0 w-px bg-border"
          style={{ left: GUIDE_OFFSET + level * TREE_INDENT }}
        />
      ))}
    </>
  )
}
