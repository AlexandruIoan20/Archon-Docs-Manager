import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useStatusStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { INDEXING_STATUS, useIndexProgress } from '../useIndexProgress'

const initialStatus = useStatusStore.getState()
const statusText = (): string => useStatusStore.getState().statusText

describe('useIndexProgress', () => {
  let mock: SoarApiMock

  beforeEach(() => {
    useStatusStore.setState(initialStatus, true)
  })

  afterEach(() => {
    delete window.soar
  })

  it('shows „Indexing…” while a sync runs and „Ready” after', async () => {
    mock = createSoarApiMock()
    window.soar = mock.api
    renderHook(() => useIndexProgress())
    await waitFor(() => expect(mock.listenerCount('index:progress')).toBe(1))

    act(() => mock.emit('index:progress', { state: 'indexing', done: 0, total: 10 }))
    expect(statusText()).toBe(INDEXING_STATUS)

    act(() => mock.emit('index:progress', { state: 'idle', done: 0, total: 0 }))
    expect(statusText()).toBe('Ready')
  })

  it('picks up a sync that started before the window loaded', async () => {
    mock = createSoarApiMock({
      indexStatus: { indexing: true, files: 0, skipped: 0, lastSync: null }
    })
    window.soar = mock.api
    renderHook(() => useIndexProgress())
    await waitFor(() => expect(statusText()).toBe(INDEXING_STATUS))
  })

  it('leaves another status alone when indexing ends', async () => {
    mock = createSoarApiMock()
    window.soar = mock.api
    renderHook(() => useIndexProgress())
    await waitFor(() => expect(mock.api.index.getStatus).toHaveBeenCalled())

    act(() => useStatusStore.getState().setStatus('Connecting…'))
    act(() => mock.emit('index:progress', { state: 'idle', done: 0, total: 0 }))
    expect(statusText()).toBe('Connecting…')
  })

  it('unsubscribes on unmount', async () => {
    mock = createSoarApiMock()
    window.soar = mock.api
    const { unmount } = renderHook(() => useIndexProgress())
    await waitFor(() => expect(mock.listenerCount('index:progress')).toBe(1))
    unmount()
    expect(mock.listenerCount('index:progress')).toBe(0)
  })
})
