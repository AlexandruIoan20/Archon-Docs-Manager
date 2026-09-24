import type { Editor } from '@tiptap/core'
import type { IconName } from '@/shared/components/icons'

export interface FormatItem {
  id: string
  label: string
  icon: IconName
  isActive: (editor: Editor) => boolean
  run: (editor: Editor) => void
  /** In the `minimal` title bar: stays a button, or moves into the „⋯” menu. */
  minimal: 'button' | 'more'
}

export interface FormatGroup {
  id: string
  /** Name of the menu the group folds into (`minimal`). */
  label: string
  icon: IconName
  /** In the `minimal` title bar: items shown one by one, or one menu for the group. */
  minimal: 'items' | 'menu'
  items: readonly FormatItem[]
}

const chain = (editor: Editor): ReturnType<Editor['chain']> => editor.chain().focus()

const heading = (level: 1 | 2 | 3): FormatItem => ({
  id: `heading${level}`,
  label: `Heading ${level}`,
  icon: `heading${level}`,
  isActive: (editor) => editor.isActive('heading', { level }),
  run: (editor) => chain(editor).toggleHeading({ level }).run(),
  minimal: 'button'
})

/** The formatting bar, described once; the title bar density decides how it renders. */
export const FORMAT_GROUPS: readonly FormatGroup[] = [
  {
    id: 'marks',
    label: 'Text',
    icon: 'bold',
    minimal: 'items',
    items: [
      {
        id: 'bold',
        label: 'Bold',
        icon: 'bold',
        isActive: (editor) => editor.isActive('bold'),
        run: (editor) => chain(editor).toggleBold().run(),
        minimal: 'button'
      },
      {
        id: 'italic',
        label: 'Italic',
        icon: 'italic',
        isActive: (editor) => editor.isActive('italic'),
        run: (editor) => chain(editor).toggleItalic().run(),
        minimal: 'button'
      },
      {
        id: 'code',
        label: 'Inline code',
        icon: 'code',
        isActive: (editor) => editor.isActive('code'),
        run: (editor) => chain(editor).toggleCode().run(),
        minimal: 'more'
      }
    ]
  },
  {
    id: 'headings',
    label: 'Heading',
    icon: 'heading',
    minimal: 'menu',
    items: [heading(1), heading(2), heading(3)]
  },
  {
    id: 'blocks',
    label: 'List',
    icon: 'list',
    minimal: 'menu',
    items: [
      {
        id: 'bulletList',
        label: 'Bulleted list',
        icon: 'list',
        isActive: (editor) => editor.isActive('bulletList'),
        run: (editor) => chain(editor).toggleBulletList().run(),
        minimal: 'button'
      },
      {
        id: 'orderedList',
        label: 'Numbered list',
        icon: 'listOrdered',
        isActive: (editor) => editor.isActive('orderedList'),
        run: (editor) => chain(editor).toggleOrderedList().run(),
        minimal: 'button'
      },
      {
        id: 'blockquote',
        label: 'Quote',
        icon: 'quote',
        isActive: (editor) => editor.isActive('blockquote'),
        run: (editor) => chain(editor).toggleBlockquote().run(),
        minimal: 'button'
      }
    ]
  },
  {
    id: 'code',
    label: 'Code',
    icon: 'codeBlock',
    minimal: 'items',
    items: [
      {
        id: 'codeBlock',
        label: 'Code block',
        icon: 'codeBlock',
        isActive: (editor) => editor.isActive('codeBlock'),
        run: (editor) => chain(editor).toggleCodeBlock().run(),
        minimal: 'more'
      }
    ]
  }
]
