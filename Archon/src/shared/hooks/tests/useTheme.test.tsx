import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import type { AppSettings, ThemePreference } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { useUiStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { useTheme, type ThemeControls } from '../useTheme'

const root = document.documentElement
const initialUi = useUiStore.getState()

function settingsWith(
  theme: ThemePreference,
  accent = DEFAULT_SETTINGS.appearance.accent
): AppSettings {
  return mergeSettings(DEFAULT_SETTINGS, { appearance: { theme, accent } })
}

function install(settings: AppSettings, platform: 'linux' | 'win32' = 'linux'): SoarApiMock {
  const mock = createSoarApiMock({ settings, platform, systemTheme: 'light' })
  window.soar = mock.api
  return mock
}

const renderTheme = (): RenderHookResult<ThemeControls, unknown> =>
  renderHook(() => useTheme(), { wrapper: queryWrapper() })

describe('useTheme', () => {
  beforeEach(() => {
    useUiStore.setState(initialUi, true)
    delete root.dataset.theme
    root.style.removeProperty('--accent')
  })

  afterEach(() => {
    delete window.soar
  })

  it('applies an explicit dark theme', async () => {
    install(settingsWith('dark'))
    const { result } = renderTheme()
    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
    expect(result.current.resolvedTheme).toBe('dark')
    expect(useUiStore.getState().resolvedTheme).toBe('dark')
  })

  it('applies an explicit light theme', async () => {
    install(settingsWith('light'))
    const { result } = renderTheme()
    await waitFor(() => expect(root.dataset.theme).toBe('light'))
    expect(result.current.preference).toBe('light')
    expect(useUiStore.getState().resolvedTheme).toBe('light')
  })

  it('follows the OS theme with `system`, live', async () => {
    const mock = install(settingsWith('system'))
    renderTheme()
    await waitFor(() => expect(root.dataset.theme).toBe('light'))

    act(() => mock.emit('system:theme-changed', 'dark'))
    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
    expect(useUiStore.getState().resolvedTheme).toBe('dark')
  })

  it('ignores OS changes unless the preference is `system`', async () => {
    const mock = install(settingsWith('dark'))
    renderTheme()
    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
    expect(mock.listenerCount('system:theme-changed')).toBe(0)
    expect(mock.api.system.getTheme).not.toHaveBeenCalled()
  })

  it('persists an explicit switch when toggled', async () => {
    const mock = install(settingsWith('system'))
    const { result } = renderTheme()
    await waitFor(() => expect(result.current.resolvedTheme).toBe('light'))

    act(() => result.current.toggleTheme())

    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
    expect(mock.api.settings.update).toHaveBeenCalledWith({ appearance: { theme: 'dark' } })
    expect(mock.storedSettings().appearance.theme).toBe('dark')
  })

  it('overrides the accent only when it is not the default', async () => {
    install(settingsWith('dark', '#22C55E'))
    renderTheme()
    await waitFor(() => expect(root.style.getPropertyValue('--accent')).toBe('#22C55E'))
  })

  it('recolors the native controls on Windows only', async () => {
    // jsdom loads no theme stylesheet, so the colors come from inline variables.
    root.style.setProperty('--bg', '#0d0f16')
    root.style.setProperty('--text2', '#8892a4')

    const onWindows = install(settingsWith('dark'), 'win32')
    const { unmount } = renderTheme()
    await waitFor(() =>
      expect(onWindows.api.window.setTitleBarColors).toHaveBeenCalledWith({
        color: '#0d0f16',
        symbolColor: '#8892a4'
      })
    )
    unmount()

    const onLinux = install(settingsWith('dark'), 'linux')
    renderTheme()
    await waitFor(() => expect(onLinux.api.app.getInfo).toHaveBeenCalled())
    expect(onLinux.api.window.setTitleBarColors).not.toHaveBeenCalled()

    root.style.removeProperty('--bg')
    root.style.removeProperty('--text2')
  })

  it('falls back to the dark default without the preload bridge', async () => {
    const { result } = renderTheme()
    expect(result.current.resolvedTheme).toBe('dark')
    await waitFor(() => expect(root.dataset.theme).toBe('dark'))
  })
})
