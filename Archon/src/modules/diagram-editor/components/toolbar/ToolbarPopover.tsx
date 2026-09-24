import { useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useEscape } from '@/shared/hooks/useEscape'
import { useFloatingPosition } from '@/shared/hooks/useFloatingPosition'
import { cn } from '@/shared/utils/cn'

export interface ToolbarPopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  label: string
  className?: string
  children: ReactNode
}

/** A small panel under a title bar control; flips and shifts to stay in the window. */
export function ToolbarPopover({
  open,
  onClose,
  anchorRef,
  label,
  className,
  children
}: ToolbarPopoverProps): React.JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null)
  useFloatingPosition(ref, { open, anchor: anchorRef, placement: 'bottom-start', offset: 6 })
  useClickOutside([ref, anchorRef], onClose, open)
  useEscape(() => {
    onClose()
    anchorRef.current?.focus()
  }, open)

  if (!open) return null
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      style={{ visibility: 'hidden' }}
      className={cn(
        'app-no-drag fixed z-40 max-w-[calc(100vw-16px)] rounded-md border border-border bg-surface p-2.5 shadow-menu',
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}
