import { Fragment } from 'react'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import type { EditorSlotProps } from '@/core/types'
import { Divider, IconButton } from '@/shared/components/ui'
import { useTitleBarDensity } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { cn } from '@/shared/utils/cn'
import { useDocumentSession } from '../store/document-editor.store'
import { FORMAT_GROUPS, type FormatItem } from './format-groups'
import { FormatMenu } from './FormatMenu'

const ALL_ITEMS = FORMAT_GROUPS.flatMap((group) => group.items)

interface ToolbarState {
  active: string[]
  canUndo: boolean
  canRedo: boolean
}

function readState(editor: Editor | null): ToolbarState {
  if (!editor) return { active: [], canUndo: false, canRedo: false }
  return {
    active: ALL_ITEMS.filter((item) => item.isActive(editor)).map((item) => item.id),
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo()
  }
}

/** The document's formatting tools, in the title bar. */
export function Toolbar({ tab }: EditorSlotProps): React.JSX.Element | null {
  const editor = useDocumentSession(tab.tabId)?.editor ?? null
  const density = useTitleBarDensity()
  const state = useEditorState({ editor, selector: ({ editor: e }) => readState(e) })
  if (!editor || !state) return null

  const active = new Set(state.active)
  const run = (item: FormatItem): void => item.run(editor)
  const button = (item: FormatItem): React.JSX.Element => (
    <IconButton
      key={item.id}
      icon={item.icon}
      label={item.label}
      active={active.has(item.id)}
      // Keeps the text selection: the click must not take focus from the editor.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => run(item)}
    />
  )

  const minimal = density === 'minimal'
  const more = minimal
    ? FORMAT_GROUPS.flatMap((g) => (g.minimal === 'items' ? g.items : [])).filter(
        (item) => item.minimal === 'more'
      )
    : []

  return (
    <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5">
      {FORMAT_GROUPS.map((group, index) => {
        if (minimal && group.minimal === 'menu') {
          return (
            <FormatMenu
              key={group.id}
              label={group.label}
              icon={group.icon}
              items={group.items}
              active={active}
              onRun={run}
            />
          )
        }
        const items = minimal
          ? group.items.filter((item) => item.minimal === 'button')
          : group.items
        if (items.length === 0) return null
        return (
          <Fragment key={group.id}>
            {index > 0 && !minimal && <Divider className="mx-1.5" />}
            {items.map(button)}
          </Fragment>
        )
      })}
      {more.length > 0 && (
        <FormatMenu label="More formatting" icon="more" items={more} active={active} onRun={run} />
      )}
      <Divider className={minimal ? 'mx-1' : 'mx-1.5'} />
      {(['undo', 'redo'] as const).map((action) => {
        const available = action === 'undo' ? state.canUndo : state.canRedo
        return (
          <IconButton
            key={action}
            icon={action}
            label={action === 'undo' ? 'Undo' : 'Redo'}
            disabled={!available}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor.chain().focus()[action]().run()}
            // Prototype: text color when available, text3 otherwise (no faded button).
            className={cn('disabled:opacity-100', available ? 'text-fg' : 'text-fg-subtle')}
          />
        )
      })}
    </div>
  )
}
