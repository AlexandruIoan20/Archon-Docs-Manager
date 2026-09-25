import { fireEvent, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSoarApiMock } from '@/test/soar-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { matchesCombo, useKeyboard, useShortcuts } from '../useKeyboard'

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

describe('matchesCombo, with a modifier', () => {
  it('also matches the physical key: Alt+B types ∫ on macOS', () => {
    const altB = key({ key: '∫', code: 'KeyB', metaKey: true, altKey: true })
    expect(matchesCombo(altB, 'mod+alt+b', true)).toBe(true)
  })

  it('reads the numpad and `plus`', () => {
    expect(
      matchesCombo(key({ key: '+', code: 'NumpadAdd', ctrlKey: true }), 'mod+plus', false)
    ).toBe(true)
    expect(
      matchesCombo(key({ key: '-', code: 'NumpadSubtract', ctrlKey: true }), 'mod+-', false)
    ).toBe(true)
  })

  it('leaves plain keys to what they type', () => {
    // A French keyboard: the key in the Q position types „a”.
    expect(matchesCombo(key({ key: 'a', code: 'KeyQ' }), 'q', false)).toBe(false)
  })
})

describe('useShortcuts', () => {
  afterEach(() => {
    delete window.soar
  })

  const setup = (): { save: ReturnType<typeof vi.fn>; undo: ReturnType<typeof vi.fn> } => {
    window.soar = createSoarApiMock({ platform: 'linux' }).api
    const save = vi.fn()
    const undo = vi.fn()
    renderHook(() => useShortcuts({ 'file.save': save, 'diagram.undo': undo }), {
      wrapper: queryWrapper()
    })
    return { save, undo }
  }

  it('runs a registry shortcut by id', () => {
    const { save, undo } = setup()
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(save).toHaveBeenCalledOnce()
    expect(undo).toHaveBeenCalledOnce()
  })

  it('fires only `whileTyping` shortcuts in a field', () => {
    const { save, undo } = setup()
    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyDown(input, { key: 's', ctrlKey: true })
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true })
    expect(save).toHaveBeenCalledOnce()
    expect(undo).not.toHaveBeenCalled()
    input.remove()
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
