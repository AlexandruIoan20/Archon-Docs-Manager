import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { DiagramEngine, UmlDiagramType } from '@/core/types'
import { useUiStore, useWorkspaceStore } from '@/store'
import { Modal, ModalBody } from '@/shared/components/ui'
import { useCreateDiagram } from '../../hooks/useCreateDiagram'
import { supportsMermaid } from '../../mermaid/templates'
import { filterCatalog, type CategoryFilter } from '../../utils/filter-catalog'
import { CategoryList } from './CategoryList'
import { DiagramTypeGrid } from './DiagramTypeGrid'
import { DialogFooter } from './DialogFooter'
import { DialogHeader } from './DialogHeader'

/** Registered in `App.tsx` as the `new-diagram` modal. */
export function NewDiagramDialog(): React.JSX.Element {
  const titleId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const closeModal = useUiStore((s) => s.closeModal)
  // The dialog's destination is the global target folder.
  const folder = useWorkspaceStore((s) => s.targetFolder)
  const setTargetFolder = useWorkspaceStore((s) => s.setTargetFolder)
  const { create, pending } = useCreateDiagram()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<UmlDiagramType>('class')
  const [chosenEngine, setEngine] = useState<DiagramEngine>('react-flow')

  const groups = filterCatalog(category, query)
  const visible = groups.flatMap((group) => group.entries)
  // A type hidden by the filter gives way to the first one shown.
  const selected = visible.find((entry) => entry.id === chosen) ?? visible[0] ?? null
  const textSupported = selected !== null && supportsMermaid(selected.id)
  // „Text” stays chosen across types, but only applies where Mermaid can draw.
  const engine: DiagramEngine = textSupported ? chosenEngine : 'react-flow'

  const submit = (type: UmlDiagramType | undefined = selected?.id): void => {
    if (!type || pending) return
    closeModal()
    void create({
      type,
      folder,
      engine: supportsMermaid(type) ? chosenEngine : 'react-flow'
    })
  }

  // Enter creates, except on a button that does something else (Cancel, close…).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' || event.defaultPrevented) return
    const target = event.target as HTMLElement
    if (target.closest('button') && !target.closest('[role="option"]')) return
    event.preventDefault()
    submit()
  }

  return (
    <Modal
      open
      onClose={closeModal}
      width={940}
      height={712}
      aria-labelledby={titleId}
      initialFocusRef={searchRef}
    >
      <div className="flex min-h-0 flex-1 flex-col" onKeyDown={onKeyDown}>
        <DialogHeader
          titleId={titleId}
          query={query}
          onQueryChange={setQuery}
          onClose={closeModal}
          searchRef={searchRef}
        />
        <CategoryList
          variant="tabs"
          value={category}
          onChange={setCategory}
          className="mx-4 mt-2.5 @min-[760px]/modal:hidden"
        />
        <div className="flex min-h-0 flex-1">
          <CategoryList
            variant="column"
            value={category}
            onChange={setCategory}
            className="hidden @min-[760px]/modal:flex"
          />
          <ModalBody>
            <DiagramTypeGrid
              groups={groups}
              selected={selected?.id ?? null}
              onSelect={setChosen}
              onCreate={submit}
              query={query}
            />
          </ModalBody>
        </div>
        <DialogFooter
          selected={selected}
          folder={folder}
          onFolderChange={setTargetFolder}
          engine={engine}
          onEngineChange={setEngine}
          textSupported={textSupported}
          onCancel={closeModal}
          onCreate={() => submit()}
          creating={pending}
        />
      </div>
    </Modal>
  )
}
