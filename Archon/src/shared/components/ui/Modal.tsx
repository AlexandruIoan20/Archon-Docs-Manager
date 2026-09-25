import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useEscape } from '@/shared/hooks/useEscape'
import { cn } from '@/shared/utils/cn'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Design width in px; capped at `100vw - 32px`. */
  width: number
  /** Design height in px; capped at `100vh - 32px`. Omit to size to content. */
  height?: number
  /** `top` pins the dialog near the top (command palette). */
  position?: 'center' | 'top'
  /** CSS max-height; defaults to `100vh - 32px`. */
  maxHeight?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  initialFocusRef?: RefObject<HTMLElement | null>
  className?: string
  children: ReactNode
}

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function Modal({
  open,
  onClose,
  width,
  height,
  position = 'center',
  maxHeight = 'calc(100vh - 32px)',
  initialFocusRef,
  className,
  children,
  ...aria
}: ModalProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEscape(onClose, open)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const target = initialFocusRef?.current ?? (dialog && focusables(dialog)[0]) ?? dialog
    target?.focus()
    return () => previous?.focus()
  }, [open, initialFocusRef])

  if (!open) return null

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>): void => {
    const dialog = dialogRef.current
    if (event.key !== 'Tab' || !dialog) return
    const items = focusables(dialog)
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (!first || !last) {
      event.preventDefault()
    } else if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      data-testid="modal-overlay"
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-[var(--overlay)] p-4 backdrop-blur-[2px]',
        position === 'center' ? 'items-center' : 'items-start pt-[min(12vh,96px)]'
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={trapFocus}
        style={{
          width: `min(${width}px, 100vw - 32px)`,
          height: height === undefined ? undefined : `min(${height}px, 100vh - 32px)`,
          maxHeight
        }}
        className={cn(
          '@container/modal flex flex-col overflow-hidden rounded-lg border border-border bg-bg text-fg shadow-modal outline-none',
          className
        )}
        {...aria}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

/** Scrollable middle section of a modal; header and footer stay fixed. */
export function ModalBody({
  className,
  children
}: {
  className?: string
  children: ReactNode
}): React.JSX.Element {
  return <div className={cn('min-h-0 flex-1 overflow-auto', className)}>{children}</div>
}
