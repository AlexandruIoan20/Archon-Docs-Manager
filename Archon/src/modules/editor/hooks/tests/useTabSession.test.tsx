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
                { relPath: 'Runbooks/on-call.soardoc', kind: 'soardoc' },
                { relPath: 'gone.soardoc', kind: 'soardoc' },
                { relPath: 'incident-policy.soardoc', kind: 'soardoc' }
              ],
              active: 'Runbooks/on-call.soardoc'
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
      expect(paths()).toEqual(['Runbooks/on-call.soardoc', 'incident-policy.soardoc'])
    )
    expect(selectActivePath(useEditorStore.getState())).toBe('Runbooks/on-call.soardoc')
  })

  it('saves changes after a pause, and not before the restore', async () => {
    const { rerender } = render('ws1', undefined)
    await waitFor(() => expect(mock.api.settings.get).toHaveBeenCalled())
    act(() => void useEditorStore.getState().openFile('x.soardoc', 'soardoc'))
    await new Promise((resolve) => setTimeout(resolve, TABS_SAVE_DELAY_MS + 50))
    expect(mock.api.settings.update).not.toHaveBeenCalled()

    rerender({ id: 'ws1', root: SAMPLE_TREE })
    await waitFor(() => expect(paths()).toHaveLength(2))
    act(
      () =>
        void useEditorStore
          .getState()
          .openFile('Playbooks/Ransomware/containment.soardiag', 'soardiag')
    )
    await waitFor(() => expect(mock.api.settings.update).toHaveBeenCalledOnce(), {
      timeout: TABS_SAVE_DELAY_MS * 3
    })
    expect(mock.storedSettings().session.tabsByWorkspace?.ws1).toEqual({
      tabs: [
        { relPath: 'Runbooks/on-call.soardoc', kind: 'soardoc' },
        { relPath: 'incident-policy.soardoc', kind: 'soardoc' },
        { relPath: 'Playbooks/Ransomware/containment.soardiag', kind: 'soardiag' }
      ],
      active: 'Playbooks/Ransomware/containment.soardiag'
    })
  })

  it('saves at once when the workspace closes, then clears the tabs', async () => {
    const { rerender } = render('ws1', SAMPLE_TREE)
    await waitFor(() => expect(paths()).toHaveLength(2))
    act(() => void useEditorStore.getState().openFile('Runbooks/on-call.soardoc', 'soardoc'))
    act(() => useEditorStore.getState().close(useEditorStore.getState().tabs[1]?.id ?? ''))

    rerender({ id: undefined, root: undefined })
    await waitFor(() => expect(mock.api.settings.update).toHaveBeenCalledOnce())
    expect(mock.storedSettings().session.tabsByWorkspace?.ws1?.tabs).toEqual([
      { relPath: 'Runbooks/on-call.soardoc', kind: 'soardoc' }
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
    openFile('Runbooks/on-call.soardoc', 'soardoc')
    openFile('deleted-elsewhere.soardoc', 'soardoc')
    renderHook(() => useTabReconciliation(SAMPLE_TREE))
    expect(paths()).toEqual(['Runbooks/on-call.soardoc'])
    expect(useUiStore.getState().toast?.message).toBe('deleted-elsewhere was deleted')
  })
})
