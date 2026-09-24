import type { Editor } from '@tiptap/core'
import { render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { expect } from 'vitest'
import type { EditorTabRef, SoarDocument } from '@/core/types'
import { useEditorStore, useUiStore } from '@/store'
import { TitleBarDensityContext } from '@/shared/components/layout/title-bar/TitleBarDensityContext'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { ok } from '@/test/workspace-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { useDocumentEditorStore } from '../../store/document-editor.store'
import { DocumentEditor } from '../DocumentEditor'
import { DocumentStatusItems } from '../DocumentStatusItems'
import { Toolbar } from '../Toolbar'

const initial = {
  editor: useEditorStore.getState(),
  ui: useUiStore.getState(),
  docs: useDocumentEditorStore.getState()
}

export const paragraph = (text: string): object => ({
  type: 'paragraph',
  content: [{ type: 'text', text }]
})

export const DOC: SoarDocument = {
  version: '1.0.0',
  id: 'doc-1',
  title: 'IR policy',
  created: '2026-09-01T10:00:00.000Z',
  lastModified: '2026-09-01T10:00:00.000Z',
  content: { type: 'doc', content: [paragraph('Isolate the host')] },
  tags: ['ir'],
  linkedDiagrams: []
}

export const editorOf = (tabId: string): Editor => {
  const editor = useDocumentEditorStore.getState().sessions[tabId]?.editor
  if (!editor) throw new Error('editor not ready')
  return editor
}

export const isDirty = (tabId: string): boolean =>
  useEditorStore.getState().tabs.find((tab) => tab.id === tabId)?.dirty ?? false

/** Fresh stores and a fake bridge serving `DOC`; returns the open tab. */
export function setupDocument(): { mock: SoarApiMock; tab: EditorTabRef } {
  useEditorStore.setState(initial.editor, true)
  useUiStore.setState(initial.ui, true)
  useDocumentEditorStore.setState(initial.docs, true)
  const mock = createSoarApiMock()
  mock.api.fs.readDocument.mockResolvedValue(ok(DOC))
  window.soar = mock.api
  const tabId = useEditorStore.getState().openFile('Runbooks/ir-policy.soardoc', 'soardoc')
  return { mock, tab: { tabId, filePath: 'Runbooks/ir-policy.soardoc', kind: 'soardoc' } }
}

/** Toolbar, body and status items, as the shell places them in their slots. */
export function renderDocument(
  tab: EditorTabRef,
  density: 'full' | 'minimal' = 'full'
): RenderResult {
  return render(
    <TitleBarDensityContext.Provider value={density}>
      <Toolbar tab={tab} />
      <DocumentEditor tab={tab} />
      <DocumentStatusItems tab={tab} />
    </TitleBarDensityContext.Provider>,
    { wrapper: queryWrapper() }
  )
}

/** Waits for the loaded body and its editor. */
export async function documentReady(tab: EditorTabRef): Promise<void> {
  await screen.findByText('Isolate the host')
  await waitFor(() =>
    expect(useDocumentEditorStore.getState().sessions[tab.tabId]?.editor).toBeTruthy()
  )
}
