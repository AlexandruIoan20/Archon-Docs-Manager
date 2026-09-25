import { fireEvent, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { selectActivePath, useEditorStore, useUiStore } from '@/store'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { useCloseGuardStore } from '../../store/close-guard.store'
import { useQuitGuard } from '../useQuitGuard'
import { useTabShortcuts } from '../useTabShortcuts'

const initial = {
  editor: useEditorStore.getState(),
  ui: useUiStore.getState(),
  guard: useCloseGuardStore.getState()
}
const active = (): string | null => selectActivePath(useEditorStore.getState())

describe('tab shortcuts', () => {
  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    const { openFile } = useEditorStore.getState()
    openFile('a.soardoc', 'soardoc')
    openFile('b.soardoc', 'soardoc')
    openFile('c.soardoc', 'soardoc')
  })

  it('cycles with Ctrl+Tab and Ctrl+Shift+Tab', () => {
    renderHook(() => useTabShortcuts(), { wrapper: queryWrapper() })
    fireEvent.keyDown(window, { code: 'Tab', ctrlKey: true })
    expect(active()).toBe('a.soardoc')
    fireEvent.keyDown(window, { code: 'Tab', ctrlKey: true, shiftKey: true })
    expect(active()).toBe('c.soardoc')
  })

  it('closes the active tab with Ctrl+W', async () => {
    renderHook(() => useTabShortcuts(), { wrapper: queryWrapper() })
    fireEvent.keyDown(window, { code: 'KeyW', ctrlKey: true })
    await waitFor(() => expect(active()).toBe('b.soardoc'))
  })
})

describe('useQuitGuard', () => {
  let mock: SoarApiMock

  beforeEach(() => {
    useEditorStore.setState(initial.editor, true)
    useUiStore.setState(initial.ui, true)
    useCloseGuardStore.setState(initial.guard, true)
    mock = createSoarApiMock()
    window.soar = mock.api
  })

  afterEach(() => {
    delete window.soar
  })

  it('announces itself to main, so the window waits for it', () => {
    renderHook(() => useQuitGuard())
    expect(mock.api.app.enableCloseGuard).toHaveBeenCalledOnce()
  })

  it('releases the window at once when nothing is unsaved', async () => {
    useEditorStore.getState().openFile('a.soardoc', 'soardoc')
    renderHook(() => useQuitGuard())
    mock.emit('app:before-quit', null)
    await waitFor(() => expect(mock.api.app.confirmClose).toHaveBeenCalledOnce())
  })

  it('asks about unsaved changes first', async () => {
    const id = useEditorStore.getState().openFile('a.soardoc', 'soardoc')
    useEditorStore.getState().setDirty(id, true)
    renderHook(() => useQuitGuard())
    mock.emit('app:before-quit', null)
    await waitFor(() => expect(useUiStore.getState().activeModal).toBe('unsaved-changes'))
    expect(useCloseGuardStore.getState().pending).toEqual({ tabIds: [id], quit: true })
    expect(mock.api.app.confirmClose).not.toHaveBeenCalled()
  })
})
