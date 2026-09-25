import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
  selectActivePath,
  selectActiveTab,
  useEditorStore,
  useUiStore,
  useWorkspaceStore
} from '@/store'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { SAMPLE_TREE } from '@/test/sample-tree'
import { SAMPLE_WORKSPACE, fail } from '@/test/workspace-api-mock'
import { ConfirmDeleteModal } from '../ConfirmDeleteModal'
import { WorkspaceSidebar } from '../WorkspaceSidebar'

const initial = {
  ui: useUiStore.getState(),
  workspace: useWorkspaceStore.getState(),
  editor: useEditorStore.getState()
}

const row = (name: string): HTMLElement => screen.getByRole('treeitem', { name })
const queryRow = (name: string): HTMLElement | null => screen.queryByRole('treeitem', { name })

describe('WorkspaceSidebar', () => {
  let mock: ArchonApiMock
  const onToggleInspector = vi.fn()

  beforeEach(async () => {
    useUiStore.setState(initial.ui, true)
    useWorkspaceStore.setState(initial.workspace, true)
    useEditorStore.setState(initial.editor, true)
    useWorkspaceStore.getState().setCurrent(SAMPLE_WORKSPACE)
    mock = createArchonApiMock({ tree: SAMPLE_TREE })
    window.archon = mock.api
    render(
      <>
        <WorkspaceSidebar onToggleInspector={onToggleInspector} onNewDiagram={vi.fn()} />
        <ModalHost modals={{ 'confirm-delete': ConfirmDeleteModal }} />
      </>,
      { wrapper: queryWrapper() }
    )
    await screen.findByRole('tree')
  })

  afterEach(() => {
    delete window.archon
    onToggleInspector.mockReset()
  })

  it('shows the workspace name and top-level entries with recursive counts', () => {
    expect(screen.getByRole('button', { name: /Workspace SecOps Core/ })).toBeInTheDocument()
    expect(row('Playbooks')).toHaveTextContent('3')
    expect(row('incident-policy')).toBeInTheDocument()
    expect(queryRow('Phishing')).not.toBeInTheDocument()
  })

  it('toggles a folder on click and makes it the target folder', () => {
    fireEvent.click(row('Playbooks'))
    expect(row('Playbooks')).toHaveAttribute('aria-expanded', 'true')
    expect(row('Playbooks')).toHaveAttribute('aria-selected', 'true')
    expect(row('Phishing')).toHaveAttribute('aria-level', '2')
    expect(useWorkspaceStore.getState().targetFolder).toBe('Playbooks')

    fireEvent.click(row('Playbooks'))
    expect(row('Playbooks')).toHaveAttribute('aria-expanded', 'false')
    expect(queryRow('Phishing')).not.toBeInTheDocument()
  })

  it('opens a file on click', () => {
    fireEvent.click(row('incident-policy'))
    expect(selectActiveTab(useEditorStore.getState())).toMatchObject({
      relPath: 'incident-policy.ardoc',
      kind: 'ardoc'
    })
    expect(row('incident-policy')).toHaveAttribute('aria-selected', 'true')
  })

  it('draws one guide line per level', () => {
    fireEvent.click(row('Playbooks'))
    fireEvent.click(row('Phishing'))
    expect(within(row('phishing-triage')).getAllByTestId('tree-guide')).toHaveLength(2)
    expect(within(row('Playbooks')).queryAllByTestId('tree-guide')).toHaveLength(0)
  })

  it('shows only diagrams on the Diagrams tab', () => {
    fireEvent.click(screen.getByRole('tab', { name: 'Diagrams' }))
    expect(queryRow('incident-policy')).not.toBeInTheDocument()
    expect(row('Playbooks')).toHaveTextContent('2')
    expect(row('Runbooks')).toHaveTextContent('0')
  })

  it('filters by search and says when nothing matches', () => {
    const search = screen.getByRole('searchbox', { name: 'Search files' })
    fireEvent.change(search, { target: { value: 'triage' } })
    expect(row('phishing-triage')).toBeInTheDocument()
    expect(queryRow('Runbooks')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('No files match “zzz”')).toBeInTheDocument()
  })

  it('moves through the tree with the keyboard', () => {
    act(() => row('Architecture').focus())
    fireEvent.keyDown(row('Architecture'), { key: 'ArrowDown' })
    expect(row('Playbooks')).toHaveFocus()

    fireEvent.keyDown(row('Playbooks'), { key: 'ArrowRight' })
    expect(row('Playbooks')).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(row('Playbooks'), { key: 'ArrowRight' })
    expect(row('Phishing')).toHaveFocus()

    fireEvent.keyDown(row('Phishing'), { key: 'ArrowLeft' })
    expect(row('Playbooks')).toHaveFocus()
    fireEvent.keyDown(row('Playbooks'), { key: 'ArrowLeft' })
    expect(row('Playbooks')).toHaveAttribute('aria-expanded', 'false')

    fireEvent.keyDown(row('Playbooks'), { key: 'End' })
    expect(row('incident-policy')).toHaveFocus()
    fireEvent.keyDown(row('incident-policy'), { key: 'Enter' })
    expect(selectActivePath(useEditorStore.getState())).toBe('incident-policy.ardoc')
    fireEvent.keyDown(row('incident-policy'), { key: 'Home' })
    expect(row('Architecture')).toHaveFocus()
  })

  it('keeps a single tab stop in the tree', () => {
    const tabbable = screen.getAllByRole('treeitem').filter((item) => item.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
  })

  it('toggles the inspector from the footer', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Toggle properties' }))
    expect(onToggleInspector).toHaveBeenCalledOnce()
  })

  it('creates a document in the target folder and opens it', async () => {
    fireEvent.click(row('Runbooks'))
    fireEvent.click(screen.getByRole('button', { name: 'More new items' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'New document' }))

    await waitFor(() =>
      expect(selectActivePath(useEditorStore.getState())).toBe('Runbooks/untitled-1.ardoc')
    )
    expect(mock.api.fs.createDocument).toHaveBeenCalledWith('Runbooks', undefined)
    expect(useUiStore.getState().toast?.message).toBe('Document created in Runbooks/')
    expect(screen.queryByRole('menu', { name: 'New' })).not.toBeInTheDocument()
  })

  it('creates a folder, renames it inline and makes it the new target', async () => {
    fireEvent.click(screen.getByRole('button', { name: 'More new items' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'New folder' }))
    await waitFor(() => expect(useWorkspaceStore.getState().renaming).toBe('new-folder-1'))
    expect(useWorkspaceStore.getState().targetFolder).toBe('new-folder-1')
    expect(useUiStore.getState().toast?.message).toBe('Folder created')

    // The fake tree does not contain the folder, so the rename runs on an existing row.
    act(() => useWorkspaceStore.getState().setRenaming('Runbooks'))
    const input = screen.getByRole('textbox', { name: 'New name' })
    fireEvent.change(input, { target: { value: 'bad/name' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('cannot contain')
    expect(mock.api.fs.rename).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Operations' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(mock.api.fs.rename).toHaveBeenCalledWith('Runbooks', 'Operations'))
    await waitFor(() => expect(useWorkspaceStore.getState().renaming).toBeNull())
  })

  it('shows a rename error from main inline', async () => {
    mock.api.fs.rename.mockResolvedValueOnce(fail('ALREADY_EXISTS', '“Runbooks” already exists'))
    act(() => useWorkspaceStore.getState().setRenaming('Playbooks'))
    const input = screen.getByRole('textbox', { name: 'New name' })
    fireEvent.change(input, { target: { value: 'Runbooks' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
  })

  it('cancels a rename with Escape', () => {
    fireEvent.doubleClick(row('Runbooks'))
    const input = screen.getByRole('textbox', { name: 'New name' })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('textbox', { name: 'New name' })).not.toBeInTheDocument()
    expect(mock.api.fs.rename).not.toHaveBeenCalled()
  })

  it('asks before moving an entry to the trash', async () => {
    fireEvent.click(row('Runbooks'))
    fireEvent.click(row('on-call'))
    fireEvent.keyDown(row('Runbooks'), { key: 'Delete' })

    const dialog = await screen.findByRole('dialog', { name: 'Move “Runbooks” to the trash?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(mock.api.fs.delete).not.toHaveBeenCalled()

    fireEvent.keyDown(row('Runbooks'), { key: 'Delete' })
    fireEvent.click(await screen.findByRole('button', { name: 'Move to trash' }))
    await waitFor(() => expect(mock.api.fs.delete).toHaveBeenCalledWith('Runbooks'))
    await waitFor(() => expect(selectActivePath(useEditorStore.getState())).toBeNull())
    expect(useWorkspaceStore.getState().targetFolder).toBe('')
    expect(useUiStore.getState().toast?.message).toBe('Runbooks moved to trash')
  })

  describe('context menu', () => {
    const menuFor = (name: string): HTMLElement => {
      fireEvent.contextMenu(row(name), { clientX: 40, clientY: 80 })
      return screen.getByRole('menu', { name })
    }

    it('offers creating inside a folder, in that folder', async () => {
      const menu = menuFor('Runbooks')
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((item) => item.textContent)
      ).toEqual([
        'New document',
        'New diagram…',
        'New folder',
        'RenameF2',
        'Reveal in file manager',
        'Copy relative path',
        'DeleteDel'
      ])
      fireEvent.click(within(menu).getByRole('menuitem', { name: /New document/ }))
      await waitFor(() =>
        expect(mock.api.fs.createDocument).toHaveBeenCalledWith('Runbooks', undefined)
      )
      expect(useWorkspaceStore.getState().targetFolder).toBe('Runbooks')
    })

    it('renames and deletes through the menu', () => {
      fireEvent.click(within(menuFor('Runbooks')).getByRole('menuitem', { name: /Rename/ }))
      expect(useWorkspaceStore.getState().renaming).toBe('Runbooks')
      act(() => useWorkspaceStore.getState().setRenaming(null))

      fireEvent.click(within(menuFor('incident-policy')).getByRole('menuitem', { name: /Delete/ }))
      expect(useUiStore.getState().activeModal).toBe('confirm-delete')
      expect(useWorkspaceStore.getState().pendingDelete?.relPath).toBe('incident-policy.ardoc')
    })

    it('copies the relative path and reveals in the file manager', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      fireEvent.click(
        within(menuFor('incident-policy')).getByRole('menuitem', { name: /Copy relative path/ })
      )
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('incident-policy.ardoc'))
      expect(useUiStore.getState().toast?.message).toBe('Path copied')

      fireEvent.click(within(menuFor('Runbooks')).getByRole('menuitem', { name: /Reveal/ }))
      expect(mock.api.workspace.reveal).toHaveBeenCalledWith('Runbooks')
    })

    it('opens a file from its menu and closes with Escape', () => {
      const menu = menuFor('incident-policy')
      expect(within(menu).getByRole('menuitem', { name: 'Open' })).toHaveFocus()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      fireEvent.click(within(menuFor('incident-policy')).getByRole('menuitem', { name: 'Open' }))
      expect(selectActivePath(useEditorStore.getState())).toBe('incident-policy.ardoc')
    })
  })
})
