import { APP_NAME } from '@/core/constants/app.constants'
import { Icon } from '@/shared/components/icons'
import { Tooltip } from '@/shared/components/ui'

export interface BrandMarkProps {
  /** Shows only the square; the app name moves into a tooltip. */
  compact?: boolean
}

function BrandSquare(): React.JSX.Element {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent">
      <Icon name="logo" size={14} />
    </span>
  )
}

export function BrandMark({ compact = false }: BrandMarkProps): React.JSX.Element {
  if (compact) {
    return (
      <Tooltip content={APP_NAME} describe={false}>
        <span role="img" aria-label={APP_NAME} className="flex shrink-0">
          <BrandSquare />
        </span>
      </Tooltip>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-[9px] pr-1.5">
      <BrandSquare />
      <span className="text-[14px] font-semibold tracking-[0.2px] whitespace-nowrap text-fg">
        {APP_NAME}
      </span>
    </span>
  )
}
