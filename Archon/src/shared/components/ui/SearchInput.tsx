import type { ComponentPropsWithRef } from 'react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

export interface SearchInputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  containerClassName?: string
}

export function SearchInput({
  containerClassName,
  className,
  placeholder,
  ...props
}: SearchInputProps): React.JSX.Element {
  return (
    <label
      className={cn(
        'flex h-7 min-w-0 items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-2 focus-within:border-accent-border',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-1 has-[input:focus-visible]:outline-accent',
        containerClassName
      )}
    >
      <Icon name="search" size={13} className="shrink-0 text-fg-subtle" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={props['aria-label'] ?? placeholder}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-[12px] text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none',
          '[&::-webkit-search-cancel-button]:hidden',
          className
        )}
        {...props}
      />
    </label>
  )
}
