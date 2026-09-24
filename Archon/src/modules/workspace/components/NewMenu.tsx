import { useId, useRef, useState } from 'react'
import { Icon, type IconName } from '@/shared/components/icons'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useEscape } from '@/shared/hooks/useEscape'
import { cn } from '@/shared/utils/cn'

export interface NewMenuProps {
  onNewDiagram: () => void
  onNewDocument: () => void
  onNewFolder: () => void
}

interface Choice {
  label: string
  icon: IconName
  run: () => void
}

const PART =
  'inline-flex h-[30px] cursor-pointer items-center bg-accent text-on-accent transition-[filter] hover:brightness-110'

/** The sidebar's "New" split button. Its menu opens inline, pushing the tree down. */
export function NewMenu({
  onNewDiagram,
  onNewDocument,
  onNewFolder
}: NewMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const close = (): void => setOpen(false)
  useClickOutside([rootRef], close, open)
  useEscape(() => {
    close()
    toggleRef.current?.focus()
  }, open)

  const choices: Choice[] = [
    { label: 'New diagram…', icon: 'flow', run: onNewDiagram },
    { label: 'New document', icon: 'file', run: onNewDocument },
    { label: 'New folder', icon: 'folder', run: onNewFolder }
  ]

  return (
    <div ref={rootRef}>
      <div className="flex px-3 pb-3">
        <button
          type="button"
          onClick={onNewDiagram}
          className={cn(
            PART,
            'min-w-0 flex-1 justify-center gap-1.5 rounded-l-sm px-3 text-[12px] font-semibold'
          )}
        >
          <Icon name="plus" size={14} className="shrink-0" />
          <span className="truncate">New</span>
        </button>
        <button
          ref={toggleRef}
          type="button"
          aria-label="More new items"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
          className={cn(PART, 'w-[26px] shrink-0 justify-center rounded-r-sm brightness-[.88]')}
        >
          <Icon name="chevD" size={12} />
        </button>
      </div>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="New"
          className="mx-3 -mt-2 mb-2.5 flex flex-col rounded-md border border-border bg-surface p-1"
        >
          {choices.map((choice, index) => (
            <button
              key={choice.label}
              type="button"
              role="menuitem"
              autoFocus={index === 0}
              onClick={() => {
                close()
                choice.run()
              }}
              className="flex h-7 cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-[12px] text-fg outline-none hover:bg-surface-2 focus:bg-surface-2"
            >
              <Icon name={choice.icon} size={14} className="shrink-0 text-fg-muted" />
              <span className="truncate">{choice.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
