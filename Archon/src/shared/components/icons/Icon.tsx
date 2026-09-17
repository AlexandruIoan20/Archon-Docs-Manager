import { ICON_DEFAULT_STROKE, ICON_PATHS, type IconName, type IconPath } from './icon-paths'

export interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  /** Accessible name; without it the icon is decorative and hidden from AT. */
  title?: string
}

export function Icon({
  name,
  size = 16,
  strokeWidth,
  className,
  title
}: IconProps): React.JSX.Element {
  const baseStroke = strokeWidth ?? ICON_DEFAULT_STROKE[name] ?? 1.5
  const paths: readonly IconPath[] = ICON_PATHS[name]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={baseStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {paths.map((path, index) =>
        typeof path === 'string' ? (
          <path key={index} d={path} />
        ) : (
          <path key={index} d={path.d} strokeWidth={path.strokeWidth} />
        )
      )}
    </svg>
  )
}
