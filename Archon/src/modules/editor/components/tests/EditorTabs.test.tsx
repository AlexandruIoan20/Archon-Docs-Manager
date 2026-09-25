import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerSaveHandler } from '@/core/editor/save-registry'
import { useEditorStore, useUiStore, useWorkspaceStore } from '@/store'
import { useCloseGuardStore } from '../../store/close-guard.store'
import { EditorTabs } from '../EditorTabs'
import { UnsavedChangesModal } from '../UnsavedChangesModal'

const initial = {
  editor: useEditorStore.getState(),
  ui: useUiStore.getState(),
  guard: useCloseGuardStore.getState()
}

const tab = (name: string): HTMLElement => screen.getByRole('tab', { name: new RegExp(name) })

function renderTabs(onNew = vi.fn()): void {
  render(
    <>
      <EditorTabs onNew={onNew} />
      {/* What ModalHost shows for `unsaved-changes`. */}
      <ModalStub />
    </>
  )
}

function ModalStub(): React.JSX.Element | null {
  return useUiStore((s) => s.activeModal) === 'unsaved-changes' ? <UnsavedChangesModal /> : null
}

describe('EditorTabs', () => {
  let ids: Record<string, string>

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    useCloseGuardStore.setState(initial.guard, true)
    const { openFile } = useEditorStore.getState()
    ids = {
      policy: openFile('Runbooks/ir-policy.ardoc', 'ardoc'),
      flow: openFile('phishing.ardiag', 'ardiag')
    }
  })

  afterEach(() => {
    delete window.archon
  })

  it('marks the active tab and shows the file path as tooltip', () => {
    renderTabs()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(tab('phishing')).toHaveAttribute('aria-selected', 'true')
    expect(tab('phishing')).toHaveClass('border-t-accent', 'bg-canvas')
    expect(tab('ir-policy')).toHaveAttribute('aria-selected', 'false')
    expect(tab('ir-policy')).toHaveAttribute('title', 'Runbooks/ir-policy.ardoc')

    fireEvent.click(tab('ir-policy'))
    expect(tab('ir-policy')).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the dirty dot', () => {
    renderTabs()
    expect(screen.queryByTestId('dirty-dot')).not.toBeInTheDocument()
    act(() => useEditorStore.getState().setDirty(ids.policy ?? '', true))
    expect(screen.getByTestId('dirty-dot')).toBeInTheDocument()
  })

  it('closes a clean tab with its button or a middle click', async () => {
    renderTabs()
    fireEvent.click(screen.getByRole('button', { name: 'Close phishing' }))
    await waitFor(() => expect(screen.queryByRole('tab', { name: /phishing/ })).toBeNull())
    expect(tab('ir-policy')).toHaveAttribute('aria-selected', 'true')

    fireEvent(tab('ir-policy'), new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    await waitFor(() => expect(screen.queryAllByRole('tab')).toHaveLength(0))
  })

  it('saves a dirty tab before closing it', async () => {
    const save = vi.fn(() => {
      useEditorStore.getState().setDirty(ids.flow ?? '', false)
      return Promise.resolve(true)
    })
    const unregister = registerSaveHandler(ids.flow ?? '', save)
    useEditorStore.getState().setDirty(ids.flow ?? '', true)
    renderTabs()

    fireEvent.click(screen.getByRole('button', { name: 'Close phishing' }))
    await waitFor(() => expect(screen.queryByRole('tab', { name: /phishing/ })).toBeNull())
    expect(save).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
    unregister()
  })

  it('asks before closing a tab whose changes could not be saved', async () => {
    useEditorStore.getState().setDirty(ids.flow ?? '', true)
    renderTabs()

    fireEvent.click(screen.getByRole('button', { name: 'Close phishing' }))
    const dialog = await screen.findByRole('dialog', { name: 'Save changes to “phishing”?' })
    expect(tab('phishing')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(dialog).not.toBeInTheDocument()
    expect(tab('phishing')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close phishing' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Don’t save' }))
    expect(screen.queryByRole('tab', { name: /phishing/ })).toBeNull()
  })

  it('keeps the dialog open when saving fails', async () => {
    const unregister = registerSaveHandler(ids.flow ?? '', () => Promise.resolve(false))
    useEditorStore.getState().setDirty(ids.flow ?? '', true)
    renderTabs()

    fireEvent.click(screen.getByRole('button', { name: 'Close phishing' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(useUiStore.getState().toast?.message).toBe('Could not save phishing')
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(tab('phishing')).toBeInTheDocument()
    unregister()
  })

  it('moves between tabs with the arrow keys', () => {
    renderTabs()
    fireEvent.keyDown(tab('phishing'), { key: 'ArrowLeft' })
    expect(tab('ir-policy')).toHaveAttribute('aria-selected', 'true')
    expect(tab('ir-policy')).toHaveFocus()
  })

  it('asks for a new diagram with „+”', () => {
    const onNew = vi.fn()
    renderTabs(onNew)
    fireEvent.click(screen.getByRole('button', { name: 'New diagram' }))
    expect(onNew).toHaveBeenCalledOnce()
  })

  describe('context menu', () => {
    const menuFor = (name: string): HTMLElement => {
      fireEvent.contextMenu(tab(name), { clientX: 200, clientY: 40 })
      return screen.getByRole('menu')
    }
    const item = (menu: HTMLElement, name: string): HTMLElement =>
      within(menu).getByRole('menuitem', { name })

    it('closes the others and those to the right', async () => {
      renderTabs()
      const titles = (): string[] => useEditorStore.getState().tabs.map((t) => t.title)
      const first = titles()[0] ?? ''
      fireEvent.click(item(menuFor(first), 'Close to the right'))
      await waitFor(() => expect(titles()).toEqual([first]))
      expect(item(menuFor(first), 'Close others')).toBeDisabled()
    })

    it('reveals the file in the sidebar and copies its path', async () => {
      renderTabs()
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      fireEvent.click(item(menuFor('ir-policy'), 'Copy path'))
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('Runbooks/ir-policy.ardoc'))

      fireEvent.click(item(menuFor('ir-policy'), 'Reveal in sidebar'))
      expect(useWorkspaceStore.getState().expanded.Runbooks).toBe(true)
    })
  })
})
