import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import type { SoarApiMock } from '@/test/soar-api-mock'
import { AUTOSAVE_DELAY_MS } from '../../hooks/useAutosave'
import {
  documentReady,
  editorOf,
  isDirty,
  paragraph,
  renderDocument,
  setupDocument
} from './document-test-utils'

describe('DocumentEditor', () => {
  let mock: SoarApiMock
  let tab: EditorTabRef

  beforeEach(() => {
    ;({ mock, tab } = setupDocument())
  })

  afterEach(() => {
    delete window.soar
  })

  it('shows path, title, body and word count', async () => {
    renderDocument(tab)
    await documentReady(tab)
    expect(screen.getByText('Runbooks/ir-policy.soardoc')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Document title' })).toHaveValue('IR policy')
    expect(screen.getByText('3 words')).toBeInTheDocument()
  })

  it('marks the tab dirty on edit and autosaves after the pause', async () => {
    renderDocument(tab)
    await documentReady(tab)
    act(() => void editorOf(tab.tabId).commands.insertContentAt(1, 'Now '))

    expect(isDirty(tab.tabId)).toBe(true)
    expect(screen.getByText('4 words')).toBeInTheDocument()
    expect(mock.api.fs.writeDocument).not.toHaveBeenCalled()

    await waitFor(() => expect(mock.api.fs.writeDocument).toHaveBeenCalledOnce(), {
      timeout: AUTOSAVE_DELAY_MS * 3
    })
    const [relPath, saved] = mock.api.fs.writeDocument.mock.calls[0] ?? []
    expect(relPath).toBe('Runbooks/ir-policy.soardoc')
    expect(saved?.content).toEqual({ type: 'doc', content: [paragraph('Now Isolate the host')] })
    await waitFor(() => expect(isDirty(tab.tabId)).toBe(false))
  })

  it('saves at once with Ctrl+S', async () => {
    renderDocument(tab)
    await documentReady(tab)
    act(() => void editorOf(tab.tabId).commands.insertContentAt(1, 'X'))
    fireEvent.keyDown(window, { code: 'KeyS', ctrlKey: true })
    await waitFor(() => expect(mock.api.fs.writeDocument).toHaveBeenCalledOnce(), { timeout: 200 })
  })

  it('saves the title with the content, without renaming the file', async () => {
    renderDocument(tab)
    await documentReady(tab)
    fireEvent.change(screen.getByRole('textbox', { name: 'Document title' }), {
      target: { value: 'Incident response policy' }
    })
    fireEvent.keyDown(window, { code: 'KeyS', ctrlKey: true })
    await waitFor(() => expect(mock.api.fs.writeDocument).toHaveBeenCalledOnce())
    expect(mock.api.fs.writeDocument.mock.calls[0]?.[0]).toBe('Runbooks/ir-policy.soardoc')
    expect(mock.api.fs.writeDocument.mock.calls[0]?.[1]).toMatchObject({
      title: 'Incident response policy',
      tags: ['ir']
    })
  })

  it('saves the last keystrokes when the tab closes right away', async () => {
    const { unmount } = renderDocument(tab)
    await documentReady(tab)
    act(() => void editorOf(tab.tabId).commands.insertContentAt(1, 'Last '))
    unmount()
    await waitFor(() => expect(mock.api.fs.writeDocument).toHaveBeenCalledOnce())
    expect(mock.api.fs.writeDocument.mock.calls[0]?.[1].content).toEqual({
      type: 'doc',
      content: [paragraph('Last Isolate the host')]
    })
  })

  it('toggles bold from the toolbar', async () => {
    renderDocument(tab)
    await documentReady(tab)
    act(() => void editorOf(tab.tabId).commands.selectAll())
    const bold = screen.getByRole('button', { name: 'Bold' })
    fireEvent.click(bold)
    expect(editorOf(tab.tabId).isActive('bold')).toBe(true)
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'))
    fireEvent.click(bold)
    expect(editorOf(tab.tabId).isActive('bold')).toBe(false)
  })

  it('folds headings into a menu in the minimal title bar', async () => {
    renderDocument(tab, 'minimal')
    await documentReady(tab)
    expect(screen.queryByRole('button', { name: 'Heading 2' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Heading' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Heading 2' }))
    expect(editorOf(tab.tabId).isActive('heading', { level: 2 })).toBe(true)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Heading' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    )

    fireEvent.click(screen.getByRole('button', { name: 'More formatting' }))
    const menu = screen.getByRole('menu', { name: 'More formatting' })
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual(['Inline code', 'Code block'])
  })
})
