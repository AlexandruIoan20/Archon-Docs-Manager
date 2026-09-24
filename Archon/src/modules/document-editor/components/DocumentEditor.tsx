import { useState } from 'react'
import { EditorContent } from '@tiptap/react'
import type { EditorSlotProps, EditorTabRef, SoarDocument } from '@/core/types'
import { EmptyState } from '@/shared/components/ui'
import { useElementSize } from '@/shared/hooks/useElementSize'
import { truncateMiddle } from '@/shared/utils/truncate-middle'
import { useDocumentController } from '../hooks/useDocumentController'
import { useDocumentFile } from '../hooks/useDocumentFile'
import { useDocumentSession } from '../store/document-editor.store'
import { DocumentTitle } from './DocumentTitle'
import '../styles/prose.css'

// JetBrains Mono advances 0.6em per glyph; the path is 11px.
const PATH_CHAR_WIDTH = 11 * 0.6

function DocumentPath({ path }: { path: string }): React.JSX.Element {
  const [ref, { width }] = useElementSize<HTMLDivElement>()
  const shown = width > 0 ? truncateMiddle(path, Math.floor(width / PATH_CHAR_WIDTH)) : path
  return (
    <div
      ref={ref}
      title={path}
      className="mb-2.5 overflow-hidden font-mono text-[11px] whitespace-nowrap text-fg-subtle"
    >
      {shown}
    </div>
  )
}

function DocumentView({
  tab,
  initial,
  latest
}: {
  tab: EditorTabRef
  initial: SoarDocument
  latest: SoarDocument | undefined
}): React.JSX.Element {
  const { editor, setTitle } = useDocumentController(tab, initial, latest)
  const title = useDocumentSession(tab.tabId)?.title ?? initial.title

  return (
    <div className="doc-scroll flex-1 overflow-y-auto bg-canvas select-text">
      <article className="doc-column mx-auto">
        <DocumentPath path={tab.filePath} />
        <DocumentTitle
          value={title}
          onChange={setTitle}
          onEnter={() => editor?.commands.focus('start')}
        />
        <EditorContent editor={editor} />
      </article>
    </div>
  )
}

/** The `.soardoc` editor: path, title and TipTap body in a centred column. */
export function DocumentEditor({ tab }: EditorSlotProps): React.JSX.Element {
  const { data, error, isPending } = useDocumentFile(tab.filePath)
  const initial = useInitial(data)

  if (initial) return <DocumentView tab={tab} initial={initial} latest={data} />
  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <EmptyState>Loading…</EmptyState>
      </div>
    )
  }
  return (
    <div role="alert" className="flex flex-1 items-center justify-center bg-canvas p-6">
      <EmptyState>
        <span className="text-fg">This document could not be opened.</span>
        <br />
        <span className="font-mono text-[11px] break-all">{error?.message}</span>
      </EmptyState>
    </div>
  )
}

/** The first version loaded; later versions reach the editor as reloads, not remounts. */
function useInitial(data: SoarDocument | undefined): SoarDocument | undefined {
  const [initial, setInitial] = useState(data)
  if (!initial && data) setInitial(data)
  return initial ?? data
}
