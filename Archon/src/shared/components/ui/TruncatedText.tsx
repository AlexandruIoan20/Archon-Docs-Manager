import type { PointerEvent } from 'react'
import { cn } from '@/shared/utils/cn'

export interface TruncatedTextProps {
  children: string
  className?: string
}

/** Single-line text with an ellipsis; the native tooltip appears only when it is cut. */
export function TruncatedText({ children, className }: TruncatedTextProps): React.JSX.Element {
  const onPointerEnter = (event: PointerEvent<HTMLSpanElement>): void => {
    const element = event.currentTarget
    if (element.scrollWidth > element.clientWidth) element.title = children
    else element.removeAttribute('title')
  }

  return (
    <span onPointerEnter={onPointerEnter} className={cn('min-w-0 truncate', className)}>
      {children}
    </span>
  )
}
