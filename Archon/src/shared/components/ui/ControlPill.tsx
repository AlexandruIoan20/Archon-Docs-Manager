import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/shared/utils/cn'

const PILL_CLASSES =
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2 text-[11px] font-medium uppercase text-fg-muted'

type PillButtonProps = { as: 'button' } & ComponentPropsWithRef<'button'>
type PillDivProps = { as?: 'div' } & ComponentPropsWithRef<'div'>

export type ControlPillProps = PillButtonProps | PillDivProps

function PillButton({
  className,
  type = 'button',
  ...rest
}: ComponentPropsWithRef<'button'>): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn(PILL_CLASSES, 'cursor-pointer hover:text-fg', className)}
      {...rest}
    />
  )
}

function PillDiv({ className, ...rest }: ComponentPropsWithRef<'div'>): React.JSX.Element {
  return <div className={cn(PILL_CLASSES, className)} {...rest} />
}

/** Toolbar container for style controls (STROKE / FILL / weight / Aa). */
export function ControlPill({ as, ...props }: ControlPillProps): React.JSX.Element {
  return as === 'button' ? (
    <PillButton {...(props as ComponentPropsWithRef<'button'>)} />
  ) : (
    <PillDiv {...(props as ComponentPropsWithRef<'div'>)} />
  )
}
