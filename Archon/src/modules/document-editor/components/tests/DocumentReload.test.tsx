import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { EditorTabRef } from '@/core/types'
import { useUiStore } from '@/store'
import type { SoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import {
  DOC,
  documentReady,
  editorOf,
  isDirty,
  paragraph,
  renderDocument,
  setupDocument
} from './document-test-utils'

describe('DocumentEditor, file changed on disk', () => {
  let mock: SoarApiMock
  let tab: EditorTabRef

  beforeEach(() => {
    ;({ mock, tab } = setupDocument())
  })

  afterEach(() => {
    delete window.soar
  })

  it('reloads a clean document changed on disk', async () => {
    renderDocument(tab)
    await documentReady(tab)
    mock.api.fs.readDocument.mockResolvedValue(
      ok({
        ...DOC,
        lastModified: '2026-09-02T10:00:00.000Z',
        content: { type: 'doc', content: [paragraph('Edited elsewhere')] }
      })
    )
    act(() => mock.emit('workspace:tree-changed', null))
    expect(await screen.findByText('Edited elsewhere')).toBeInTheDocument()
    expect(isDirty(tab.tabId)).toBe(false)
  })

  it('offers a reload when a dirty document changes on disk', async () => {
    renderDocument(tab)
    await documentReady(tab)
    act(() => void editorOf(tab.tabId).commands.insertContentAt(1, 'Mine '))
    mock.api.fs.readDocument.mockResolvedValue(
      ok({
        ...DOC,
        lastModified: '2026-09-02T10:00:00.000Z',
        content: { type: 'doc', content: [paragraph('Theirs')] }
      })
    )
    act(() => mock.emit('workspace:tree-changed', null))

    await waitFor(() =>
      expect(useUiStore.getState().toast?.message).toBe('IR policy changed on disk')
    )
    expect(screen.getByText('Mine Isolate the host')).toBeInTheDocument()
    act(() => useUiStore.getState().toast?.action?.run())
    expect(await screen.findByText('Theirs')).toBeInTheDocument()
    expect(isDirty(tab.tabId)).toBe(false)
  })
})
