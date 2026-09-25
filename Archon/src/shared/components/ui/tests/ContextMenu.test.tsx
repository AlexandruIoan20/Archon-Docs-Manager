import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useContextMenu, type ContextMenuControls } from '../ContextMenu'
import type { ContextMenuEntry } from '../context-menu.types'

function Harness({ onReady }: { onReady: (menu: ContextMenuControls) => void }): React.JSX.Element {
  const menu = useContextMenu()
  onReady(menu)
  return <>{menu.element}</>
}

function setup(items: ContextMenuEntry[]): void {
  let controls: ContextMenuControls | null = null
  render(<Harness onReady={(menu) => (controls = menu)} />)
  act(() => controls?.open({ clientX: 100, clientY: 100 }, items, 'Things'))
}

describe('useContextMenu', () => {
  it('opens at the pointer, moves with the arrows and runs an item', () => {
    const second = vi.fn()
    setup([
      { label: 'First', onSelect: vi.fn() },
      { type: 'separator' },
      { label: 'Second', onSelect: second },
      { label: 'Gone', disabled: true, title: 'Not now', onSelect: vi.fn() }
    ])
    const menu = screen.getByRole('menu', { name: 'Things' })
    expect(within(menu).getByRole('menuitem', { name: 'First' })).toHaveFocus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(within(menu).getByRole('menuitem', { name: 'Second' })).toHaveFocus()
    expect(within(menu).getByRole('menuitem', { name: 'Gone' })).toHaveAttribute('title', 'Not now')
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Second' }))
    expect(second).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens a submenu with → and goes back with ←', () => {
    const pick = vi.fn()
    setup([{ type: 'submenu', label: 'Change type', items: [{ label: 'Action', onSelect: pick }] }])
    const parent = within(screen.getByRole('menu', { name: 'Things' })).getByRole('menuitem', {
      name: 'Change type'
    })
    fireEvent.keyDown(parent, { key: 'ArrowRight' })
    const submenu = screen.getByRole('menu', { name: 'Change type' })
    expect(parent).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(submenu, { key: 'ArrowLeft' })
    expect(screen.queryByRole('menu', { name: 'Change type' })).not.toBeInTheDocument()
    expect(parent).toHaveFocus()
  })

  it('closes with Escape and a click outside', () => {
    setup([{ label: 'First', onSelect: vi.fn() }])
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    setup([{ label: 'First', onSelect: vi.fn() }])
    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
