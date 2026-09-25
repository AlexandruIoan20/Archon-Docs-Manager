import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { stepZoom, useUiZoom, type UiZoomControls } from '../useUiZoom'

describe('stepZoom', () => {
  it('moves one step and stops at the ends', () => {
    expect(stepZoom(1, 1)).toBe(1.1)
    expect(stepZoom(1.1, 1)).toBe(1.25)
    expect(stepZoom(1.5, 1)).toBe(1.5)
    expect(stepZoom(0.9, -1)).toBe(0.8)
    expect(stepZoom(0.8, -1)).toBe(0.8)
  })

  it('treats an unknown factor as 100%', () => {
    expect(stepZoom(1.33, 1)).toBe(1.1)
  })
})

describe('useUiZoom', () => {
  let mock: SoarApiMock

  const render = async (uiZoom: number): Promise<RenderHookResult<UiZoomControls, unknown>> => {
    mock = createSoarApiMock({
      settings: mergeSettings(DEFAULT_SETTINGS, { appearance: { uiZoom } })
    })
    window.soar = mock.api
    const hook = renderHook(() => useUiZoom(), { wrapper: queryWrapper() })
    await waitFor(() => expect(hook.result.current.zoom).toBe(uiZoom))
    return hook
  }

  const press = (code: string, init: KeyboardEventInit = { ctrlKey: true }): void => {
    fireEvent.keyDown(window, { code, ...init })
  }

  beforeEach(() => {
    delete window.soar
  })

  afterEach(() => {
    delete window.soar
  })

  it('zooms in with Ctrl+= and persists the factor', async () => {
    const { result } = await render(1)
    press('Equal')

    await waitFor(() => expect(result.current.zoom).toBe(1.1))
    expect(mock.api.window.setZoom).toHaveBeenCalledWith(1.1)
    expect(mock.api.settings.update).toHaveBeenCalledWith({ appearance: { uiZoom: 1.1 } })
  })

  it('zooms out with Ctrl+- and the numpad', async () => {
    const { result } = await render(1.25)
    press('Minus')
    await waitFor(() => expect(result.current.zoom).toBe(1.1))
    press('NumpadSubtract')
    await waitFor(() => expect(result.current.zoom).toBe(1))
  })

  it('resets with Ctrl+0', async () => {
    const { result } = await render(1.5)
    press('Digit0')
    await waitFor(() => expect(result.current.zoom).toBe(1))
    expect(mock.api.window.setZoom).toHaveBeenLastCalledWith(1)
  })

  it('does nothing at the limit or without the modifier', async () => {
    await render(1.5)
    press('Equal')
    press('Equal', {})
    press('Equal', { ctrlKey: true, altKey: true })
    expect(mock.api.window.setZoom).not.toHaveBeenCalled()
    expect(mock.api.settings.update).not.toHaveBeenCalled()
  })
})
