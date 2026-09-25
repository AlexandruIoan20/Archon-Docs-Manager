import { useId } from 'react'
import type { EditorSlotProps } from '@/core/types'
import { openSearchPalette } from '@/store'
import { Button, EmptyState, SectionLabel, TagInput } from '@/shared/components/ui'
import { useDocumentEditorStore, useDocumentSession } from '../store/document-editor.store'

/** Tags and linked diagrams of the document, in the right panel. */
export function DocumentInspector({ tab }: EditorSlotProps): React.JSX.Element | null {
  const tagsId = useId()
  const session = useDocumentSession(tab.tabId)
  if (!session) return null

  const setTags = (tags: string[]): void => {
    useDocumentEditorStore.getState().patch(tab.tabId, { tags })
    session.changed()
  }

  // Pick a diagram in the palette, filtered on `.ardiag`; its id goes in the list.
  const linkDiagram = (): void =>
    openSearchPalette({
      kind: 'ardiag',
      placeholder: 'Link a diagram…',
      onPick: (result) => {
        const current = useDocumentEditorStore.getState().sessions[tab.tabId]?.linkedDiagrams ?? []
        if (current.includes(result.fileId)) return
        useDocumentEditorStore
          .getState()
          .patch(tab.tabId, { linkedDiagrams: [...current, result.fileId] })
        session.changed()
      }
    })

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-3.5">
      <section>
        <SectionLabel id={tagsId}>Tags</SectionLabel>
        <TagInput
          aria-label="Add tag"
          tags={session.tags}
          onAdd={(tag) => setTags([...session.tags, tag])}
          onRemove={(tag) => setTags(session.tags.filter((t) => t !== tag))}
        />
      </section>
      <section>
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>Linked diagrams</SectionLabel>
          <Button size="sm" icon="link" className="-mt-1.5 h-6 px-2" onClick={linkDiagram}>
            Link diagram
          </Button>
        </div>
        {session.linkedDiagrams.length === 0 ? (
          <EmptyState className="text-left">No linked diagrams yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-1 font-mono text-[11px] text-fg-muted">
            {session.linkedDiagrams.map((id) => (
              <li key={id} className="truncate" title={id}>
                {id}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
