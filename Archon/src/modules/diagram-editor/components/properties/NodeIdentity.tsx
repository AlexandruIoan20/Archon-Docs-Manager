import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'

export interface NodeIdentityProps {
  icon: IconName
  /** `#RRGGBB`; the badge takes it at 18%. */
  color: string
  title: ReactNode
  id: string
}

/** Badge, type and id: the first row of the panel. */
export function NodeIdentity({ icon, color, title, id }: NodeIdentityProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden
        className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-md"
        // 0x2E / 0xFF ≈ .18
        style={{ backgroundColor: `${color}2E`, color }}
      >
        <Icon name={icon} size={12} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-fg-muted">{title}</span>
      <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{id}</span>
    </div>
  )
}
