import { useEffect, useRef, type MouseEvent } from 'react'
import type { EditorTab as EditorTabModel } from '@/store'
import { Icon } from '@/shared/components/icons'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { cn } from '@/shared/utils/cn'

/** Below this width the close button only shows on the active tab and on hover. */
export const NARROW_TAB_WIDTH = 120

export interface EditorTabProps {
  tab: EditorTabModel
  active: boolean
  onActivate: (id: string) => void
  onClose: (id: string) => void
  /** Right click (plan 20). */
  onContextMenu?: (event: MouseEvent) => void
}

export function EditorTab({
  tab,
  active,
  onActivate,
  onClose,
  onContextMenu
}: EditorTabProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [sizeRef, { width }] = useElementSize<HTMLDivElement>()
  const narrow = width > 0 && width < NARROW_TAB_WIDTH

  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
  }, [active])

  const setRefs = (element: HTMLDivElement | null): void => {
    ref.current = element
    sizeRef(element)
  }

  const onAuxClick = (event: MouseEvent): void => {
    if (event.button !== 1) return
    event.preventDefault()
    onClose(tab.id)
  }

  return (
    <div
      ref={setRefs}
      role="tab"
      tabIndex={active ? 0 : -1}
      aria-selected={active}
      title={tab.relPath}
      data-tab-id={tab.id}
      onClick={() => onActivate(tab.id)}
      // Middle-click must not start autoscroll before `auxclick` closes the tab.
      onMouseDown={(event) => event.button === 1 && event.preventDefault()}
      onAuxClick={onAuxClick}
      onContextMenu={onContextMenu}
      className={cn(
        'group flex max-w-[220px] min-w-[96px] shrink cursor-pointer items-center gap-2 border-r border-border px-3.5',
        'border-t-2 outline-offset-[-2px]',
        active ? 'border-t-accent bg-canvas text-fg' : 'border-t-transparent text-fg-muted'
      )}
    >
      <Icon
        name={tab.kind === 'soardiag' ? 'flow' : 'file'}
        size={13}
        className={cn('shrink-0', active ? 'text-accent' : 'text-fg-muted')}
      />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{tab.title}</span>
      {tab.dirty && (
        <span
          data-testid="dirty-dot"
          aria-label="Unsaved changes"
          className="size-[5px] shrink-0 rounded-full bg-accent"
        />
      )}
      <button
        type="button"
        aria-label={`Close ${tab.title}`}
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation()
          onClose(tab.id)
        }}
        className={cn(
          'inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs text-fg-muted hover:bg-surface-2 hover:text-fg',
          // The space stays reserved so the name does not jump on hover.
          narrow && !active && 'invisible group-hover:visible focus-visible:visible'
        )}
      >
        <Icon name="close" size={11} />
      </button>
    </div>
  )
}
