export const ARROW_MARKER_ID = 'soar-arrow'
export const HOT_ARROW_MARKER_ID = 'soar-arrow-hot'

/** The two arrowheads, defined once per canvas. */
export function EdgeMarkers(): React.JSX.Element {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        {[
          { id: ARROW_MARKER_ID, className: 'soar-arrow' },
          { id: HOT_ARROW_MARKER_ID, className: 'soar-arrow soar-arrow--hot' }
        ].map(({ id, className }) => (
          <marker
            key={id}
            id={id}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 1 9 5 0 9Z" className={className} />
          </marker>
        ))}
      </defs>
    </svg>
  )
}
