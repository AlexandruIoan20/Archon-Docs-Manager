import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Menu, MenuItem } from '../Menu'

function Harness({ onPng = vi.fn() }: { onPng?: () => void }): React.JSX.Element {
  const [open, setOpen] = useState(true)
  const anchorRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={anchorRef} onClick={() => setOpen((value) => !value)}>
        Export
      </button>
      <button>Elsewhere</button>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchor={anchorRef}
        aria-label="Export formats"
      >
        <MenuItem onSelect={onPng} suffix=".png">
          PNG
        </MenuItem>
        <MenuItem disabled>UML XMI</MenuItem>
        <MenuItem suffix=".svg">SVG</MenuItem>
        <MenuItem danger>Delete</MenuItem>
      </Menu>
    </>
  )
}

const menu = (): HTMLElement | null => screen.queryByRole('menu', { name: 'Export formats' })
const item = (name: string): HTMLElement => screen.getByRole('menuitem', { name: new RegExp(name) })

describe('Menu', () => {
  it('renders items in a portal and focuses the first enabled one', () => {
    render(<Harness />)
    expect(menu()?.parentElement).toBe(document.body)
    expect(item('PNG')).toHaveFocus()
    expect(item('PNG')).toHaveTextContent('.png')
  })

  it('moves focus with arrow keys, skipping disabled items and wrapping', () => {
    render(<Harness />)
    fireEvent.keyDown(item('PNG'), { key: 'ArrowDown' })
    expect(item('SVG')).toHaveFocus()
    fireEvent.keyDown(item('SVG'), { key: 'End' })
    expect(item('Delete')).toHaveFocus()
    fireEvent.keyDown(item('Delete'), { key: 'ArrowDown' })
    expect(item('PNG')).toHaveFocus()
    fireEvent.keyDown(item('PNG'), { key: 'ArrowUp' })
    expect(item('Delete')).toHaveFocus()
  })

  it('runs the action and closes on select', () => {
    const onPng = vi.fn()
    render(<Harness onPng={onPng} />)
    fireEvent.click(item('PNG'))
    expect(onPng).toHaveBeenCalledOnce()
    expect(menu()).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the anchor', () => {
    render(<Harness />)
    fireEvent.keyDown(item('PNG'), { key: 'Escape' })
    expect(menu()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus()
  })

  it('closes on a press outside', () => {
    render(<Harness />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(menu()).not.toBeInTheDocument()
  })

  it('lets the anchor toggle it closed without reopening', () => {
    render(<Harness />)
    const anchor = screen.getByRole('button', { name: 'Export' })
    fireEvent.mouseDown(anchor)
    expect(menu()).toBeInTheDocument()
    fireEvent.click(anchor)
    expect(menu()).not.toBeInTheDocument()
  })

  it('is placed inside the window margins once positioned', () => {
    render(<Harness />)
    const element = menu() as HTMLElement
    expect(element.style.visibility).toBe('visible')
    const left = parseFloat(element.style.left)
    expect(left).toBeGreaterThanOrEqual(8)
    expect(left + element.offsetWidth).toBeLessThanOrEqual(window.innerWidth - 8)
  })
})
