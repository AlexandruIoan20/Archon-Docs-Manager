import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FolderEntry } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { selectActivePath, useEditorStore, useUiStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { SAMPLE_TREE } from '@/test/sample-tree'
import { TABS_SAVE_DELAY_MS, useTabSession } from '../useTabSession'
import { useTabReconciliation } from '../useTabReconciliation'

const initial = { editor: useEditorStore.getState(), ui: useUiStore.getState() }
const paths = (): string[] => useEditorStore.getState().tabs.map((tab) => tab.relPath)

describe('useTabSession', () => {
  let mock: SoarApiMock

  type Props = { id: string | undefined; root: FolderEntry | undefined }
  const render = (
    workspaceId: string | undefined,
    tree: FolderEntry | undefined
  ): RenderHookResult<void, Props> =>
    renderHook(({ id, root }) => useTabSession(id, root), {
      initialProps: { id: workspaceId, root: tree },
      wrapper: queryWrapper()
    })

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    mock = createSoarApiMock({
      settings: mergeSettings(DEFAULT_SETTINGS, {
        session: {
          tabsByWorkspace: {
            ws1: {
              tabs: [
                { relPath: 'Runbooks/on-call.ardoc', kind: 'ardoc' },
                { relPath: 'gone.ardoc', kind: 'ardoc' },
                { relPath: 'incident-policy.ardoc', kind: 'ardoc' }
              ],
              active: 'Runbooks/on-call.ardoc'
            }
          }
        }
      })
    })
    window.soar = mock.api
  })

  afterEach(() => {
    vi.useRealTimers()
    delete window.soar
  })

  it('restores the saved tabs that still exist, once the tree is known', async () => {
    const { rerender } = render('ws1', undefined)
    expect(paths()).toEqual([])
    rerender({ id: 'ws1', root: SAMPLE_TREE })
    await waitFor(() =>
      expect(paths()).toEqual(['Runbooks/on-call.ardoc', 'incident-policy.ardoc'])
    )
    expect(selectActivePath(useEditorStore.getState())).toBe('Runbooks/on-call.ardoc')
  })

  it('saves changes after a pause, and not before the restore', async () => {
    const { rerender } = render('ws1', undefined)
    await waitFor(() => expect(mock.api.settings.get).toHaveBeenCalled())
    act(() => void useEditorStore.getState().openFile('x.ardoc', 'ardoc'))
    await new Promise((resolve) => setTimeout(resolve, TABS_SAVE_DELAY_MS + 50))
    expect(mock.api.settings.update).not.toHaveBeenCalled()

    rerender({ id: 'ws1', root: SAMPLE_TREE })
    await waitFor(() => expect(paths()).toHaveLength(2))
    act(
      () =>
        void useEditorStore.getState().openFile('Playbooks/Ransomware/containment.ardiag', 'ardiag')
    )
    await waitFor(() => expect(mock.api.settings.update).toHaveBeenCalledOnce(), {
      timeout: TABS_SAVE_DELAY_MS * 3
    })
    expect(mock.storedSettings().session.tabsByWorkspace?.ws1).toEqual({
      tabs: [
        { relPath: 'Runbooks/on-call.ardoc', kind: 'ardoc' },
        { relPath: 'incident-policy.ardoc', kind: 'ardoc' },
        { relPath: 'Playbooks/Ransomware/containment.ardiag', kind: 'ardiag' }
      ],
      active: 'Playbooks/Ransomware/containment.ardiag'
    })
  })

  it('saves at once when the workspace closes, then clears the tabs', async () => {
    const { rerender } = render('ws1', SAMPLE_TREE)
    await waitFor(() => expect(paths()).toHaveLength(2))
    act(() => void useEditorStore.getState().openFile('Runbooks/on-call.ardoc', 'ardoc'))
    act(() => useEditorStore.getState().close(useEditorStore.getState().tabs[1]?.id ?? ''))

    rerender({ id: undefined, root: undefined })
    await waitFor(() => expect(mock.api.settings.update).toHaveBeenCalledOnce())
    expect(mock.storedSettings().session.tabsByWorkspace?.ws1?.tabs).toEqual([
      { relPath: 'Runbooks/on-call.ardoc', kind: 'ardoc' }
    ])
    expect(paths()).toEqual([])
  })
})

describe('useTabReconciliation', () => {
  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
  })

  it('closes tabs whose files are gone, with a toast', () => {
    const { openFile } = useEditorStore.getState()
    openFile('Runbooks/on-call.ardoc', 'ardoc')
    openFile('deleted-elsewhere.ardoc', 'ardoc')
    renderHook(() => useTabReconciliation(SAMPLE_TREE))
    expect(paths()).toEqual(['Runbooks/on-call.ardoc'])
    expect(useUiStore.getState().toast?.message).toBe('deleted-elsewhere was deleted')
  })
})
