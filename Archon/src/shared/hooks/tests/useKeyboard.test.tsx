import { fireEvent, render, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { matchesCombo, useKeyboard } from '../useKeyboard'

const key = (init: KeyboardEventInit): KeyboardEvent => new KeyboardEvent('keydown', init)

describe('matchesCombo', () => {
  it('maps mod to Ctrl, or to Cmd on macOS', () => {
    expect(matchesCombo(key({ key: 'z', ctrlKey: true }), 'mod+z', false)).toBe(true)
    expect(matchesCombo(key({ key: 'z', metaKey: true }), 'mod+z', false)).toBe(false)
    expect(matchesCombo(key({ key: 'z', metaKey: true }), 'mod+z', true)).toBe(true)
    expect(matchesCombo(key({ key: 'z', ctrlKey: true }), 'mod+z', true)).toBe(false)
  })

  it('needs the exact modifiers', () => {
    expect(
      matchesCombo(key({ key: 'Z', ctrlKey: true, shiftKey: true }), 'mod+shift+z', false)
    ).toBe(true)
    expect(matchesCombo(key({ key: 'Z', ctrlKey: true, shiftKey: true }), 'mod+z', false)).toBe(
      false
    )
    expect(matchesCombo(key({ key: 'n' }), 'n', false)).toBe(true)
    expect(matchesCombo(key({ key: 'n', ctrlKey: true }), 'n', false)).toBe(false)
    expect(matchesCombo(key({ key: 'Delete' }), 'delete', false)).toBe(true)
  })
})

describe('useKeyboard', () => {
  it('runs the matching handler and prevents the default', () => {
    const undo = vi.fn()
    renderHook(() => useKeyboard({ 'mod+z': undo }, { platform: 'linux' }))
    const allowed = fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(undo).toHaveBeenCalledOnce()
    expect(allowed).toBe(false)
  })

  it('ignores keys typed in editable fields', () => {
    const remove = vi.fn()
    renderHook(() => useKeyboard({ backspace: remove }))
    const { getByRole, getByTestId } = render(
      <>
        <input aria-label="field" />
        <div data-testid="rich" contentEditable suppressContentEditableWarning>
          text
        </div>
      </>
    )
    fireEvent.keyDown(getByRole('textbox', { name: 'field' }), { key: 'Backspace' })
    fireEvent.keyDown(getByTestId('rich'), { key: 'Backspace' })
    expect(remove).not.toHaveBeenCalled()
    fireEvent.keyDown(document.body, { key: 'Backspace' })
    expect(remove).toHaveBeenCalledOnce()
  })

  it('does nothing while disabled', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboard({ n: handler }, { enabled: false }))
    fireEvent.keyDown(window, { key: 'n' })
    expect(handler).not.toHaveBeenCalled()
  })
})
