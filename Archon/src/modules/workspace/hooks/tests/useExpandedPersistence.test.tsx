import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { selectExpandedPaths, useWorkspaceStore } from '@/store'
import { settingsQuery } from '@/shared/hooks/useSettings'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { createTestQueryClient, queryWrapper } from '@/test/render-with-query'
import { SAMPLE_WORKSPACE } from '@/test/workspace-api-mock'
import { EXPANDED_SAVE_DELAY_MS, useExpandedPersistence } from '../useExpandedPersistence'

const initialState = useWorkspaceStore.getState()

describe('useExpandedPersistence', () => {
  let mock: ArchonApiMock

  beforeEach(() => {
    vi.useFakeTimers()
    useWorkspaceStore.setState(initialState, true)
    const settings = mergeSettings(DEFAULT_SETTINGS, {
      session: { expandedByWorkspace: { [SAMPLE_WORKSPACE.id]: ['Playbooks'], other: ['X'] } }
    })
    mock = createArchonApiMock({ settings })
    window.archon = mock.api
    const client = createTestQueryClient()
    client.setQueryData(settingsQuery.queryKey, settings)
    renderHook(() => useExpandedPersistence(), { wrapper: queryWrapper(client) })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete window.archon
  })

  it('restores the expanded folders of the workspace that opens', () => {
    act(() => useWorkspaceStore.getState().setCurrent(SAMPLE_WORKSPACE))
    expect(selectExpandedPaths(useWorkspaceStore.getState())).toEqual(['Playbooks'])
  })

  it('saves changes for that workspace only, debounced', async () => {
    act(() => useWorkspaceStore.getState().setCurrent(SAMPLE_WORKSPACE))
    act(() => {
      useWorkspaceStore.getState().setExpanded('Runbooks', true)
      useWorkspaceStore.getState().setExpanded('Playbooks', false)
    })
    expect(mock.api.settings.update).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(EXPANDED_SAVE_DELAY_MS)
    })
    expect(mock.api.settings.update).toHaveBeenCalledExactlyOnceWith({
      session: { expandedByWorkspace: { [SAMPLE_WORKSPACE.id]: ['Runbooks'] } }
    })
    expect(mock.storedSettings().session.expandedByWorkspace).toEqual({
      [SAMPLE_WORKSPACE.id]: ['Runbooks'],
      other: ['X']
    })
  })
})
