import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFloatingPosition } from '@/shared/hooks/useFloatingPosition'
import { cn } from '@/shared/utils/cn'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  delay?: number
  placement?: 'bottom' | 'top'
  /**
   * Links the tooltip with `aria-describedby`. Off when the trigger already
   * carries the same text as its accessible name (e.g. `IconButton`).
   */
  describe?: boolean
  className?: string
}

export function Tooltip({
  content,
  children,
  delay = 500,
  placement = 'bottom',
  describe = true,
  className
}: TooltipProps): React.JSX.Element {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useFloatingPosition(tooltipRef, { open, anchor: anchorRef, placement, offset: 6 })
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = (): void => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = (): void => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      ref={anchorRef}
      className={cn('inline-flex', className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open && describe ? id : undefined}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={{ visibility: 'hidden' }}
            className="pointer-events-none fixed z-[70] max-w-[280px] overflow-hidden rounded-sm border border-border bg-surface px-2 py-1 text-[11px] leading-snug text-fg shadow-menu"
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  )
}
