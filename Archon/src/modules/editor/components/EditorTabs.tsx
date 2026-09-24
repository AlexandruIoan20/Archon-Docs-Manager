import { useRef, type KeyboardEvent, type WheelEvent } from 'react'
import { Icon } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useEditorTabs } from '../hooks/useEditorTabs'
import { useHorizontalOverflow } from '../hooks/useHorizontalOverflow'
import { EditorTab } from './EditorTab'
import { TabOverflowMenu } from './TabOverflowMenu'

export interface EditorTabsProps {
  /** The „+” button: a new diagram. */
  onNew: () => void
}

const FADE = 'pointer-events-none absolute inset-y-0 w-4 from-side to-transparent'

/** The tab strip: scrolls horizontally when full, with „+” and the tab menu pinned right. */
export function EditorTabs({ onNew }: EditorTabsProps): React.JSX.Element {
  const { tabs, activeId, activate, requestClose } = useEditorTabs()
  const listRef = useRef<HTMLDivElement>(null)
  const { overflowing, atStart, atEnd } = useHorizontalOverflow(listRef, tabs.length)

  // A plain mouse wheel scrolls vertically; the strip turns it sideways.
  const onWheel = (event: WheelEvent<HTMLDivElement>): void => {
    const list = listRef.current
    if (!list || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    list.scrollLeft += event.deltaY
  }

  // Arrow keys move between tabs (roving tabindex, WAI-ARIA tabs pattern).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = tabs.findIndex((tab) => tab.id === activeId)
    const target: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1
    }
    const next = event.key in target ? tabs[target[event.key]] : undefined
    if (!next) return
    event.preventDefault()
    activate(next.id)
    listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${next.id}"]`)?.focus()
  }

  return (
    <div
      data-testid="tab-bar"
      className="flex h-[var(--size-tabbar)] shrink-0 items-stretch border-b border-border bg-side"
    >
      <div className="relative flex min-w-0 flex-1">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Open files"
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className="flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => (
            <EditorTab
              key={tab.id}
              tab={tab}
              active={tab.id === activeId}
              onActivate={activate}
              onClose={(id) => void requestClose([id])}
            />
          ))}
        </div>
        {!atStart && <div data-testid="fade-start" className={cn(FADE, 'left-0 bg-linear-to-r')} />}
        {!atEnd && <div data-testid="fade-end" className={cn(FADE, 'right-0 bg-linear-to-l')} />}
      </div>
      <div className="flex shrink-0 items-center">
        {overflowing && (
          <div className="px-1">
            <TabOverflowMenu tabs={tabs} activeId={activeId} onActivate={activate} />
          </div>
        )}
        <button
          type="button"
          aria-label="New diagram"
          title="New diagram"
          onClick={onNew}
          className="flex h-full cursor-pointer items-center px-3 text-fg-subtle hover:text-fg"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  )
}
