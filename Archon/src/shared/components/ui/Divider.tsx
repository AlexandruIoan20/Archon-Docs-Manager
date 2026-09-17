import { cn } from '@/shared/utils/cn'

export interface DividerProps {
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export function Divider({ orientation = 'vertical', className }: DividerProps): React.JSX.Element {
  return (
    <span
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'block shrink-0 bg-border',
        orientation === 'vertical' ? 'h-[22px] w-px' : 'h-px w-full',
        className
      )}
    />
  )
}
