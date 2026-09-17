import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUiStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { LAYOUT_SAVE_DELAY_MS, useLayoutPersistence } from '../useLayoutPersistence'

const initialUi = useUiStore.getState()

describe('useLayoutPersistence', () => {
  let mock: SoarApiMock

  beforeEach(() => {
    vi.useFakeTimers()
    useUiStore.setState(initialUi, true)
    mock = createSoarApiMock()
    window.soar = mock.api
    renderHook(() => useLayoutPersistence(), { wrapper: queryWrapper() })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete window.soar
  })

  const flush = async (): Promise<void> => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LAYOUT_SAVE_DELAY_MS)
    })
  }

  it('saves widths and visibility once, after the changes settle', async () => {
    act(() => {
      useUiStore.getState().setPanelWidth('sidebar', 300)
      useUiStore.getState().setPanelWidth('sidebar', 320)
      useUiStore.getState().togglePanel('inspector', false)
    })
    await flush()

    expect(mock.api.settings.update).toHaveBeenCalledOnce()
    expect(mock.api.settings.update).toHaveBeenCalledWith({
      layout: {
        sidebar: { visible: true, width: 320 },
        inspector: { visible: false, width: 240 }
      }
    })
  })

  it('does not write while an edge is dragged, then writes on drop', async () => {
    const { setPanelResizing, setPanelWidth } = useUiStore.getState()
    act(() => {
      setPanelResizing(true)
      setPanelWidth('inspector', 300)
    })
    await flush()
    act(() => setPanelWidth('inspector', 330))
    await flush()
    expect(mock.api.settings.update).not.toHaveBeenCalled()

    act(() => setPanelResizing(false))
    await flush()
    expect(mock.api.settings.update).toHaveBeenCalledOnce()
    expect(mock.storedSettings().layout.inspector.width).toBe(330)
  })

  it('does not save drawer toggles', async () => {
    act(() => useUiStore.getState().togglePanel('inspector', true))
    act(() => useUiStore.getState().closeOverlays())
    await flush()
    expect(mock.api.settings.update).not.toHaveBeenCalled()
  })
})
