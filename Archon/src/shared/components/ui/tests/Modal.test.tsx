import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Modal, ModalBody } from '../Modal'
import { Menu, MenuItem } from '../Menu'

function Harness({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <>
      <button>Opener</button>
      <Modal open onClose={onClose} width={940} height={712} aria-label="New diagram">
        <button>First</button>
        <ModalBody>
          <input aria-label="Search diagram types" />
        </ModalBody>
        <button>Last</button>
      </Modal>
    </>
  )
}

function Toggleable(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} width={480} aria-label="Dialog">
        <button>Inside</button>
      </Modal>
    </>
  )
}

function WithMenu({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  return (
    <Modal open onClose={onClose} width={480} aria-label="Dialog">
      <button ref={anchorRef} onClick={() => setMenuOpen(true)}>
        Folder
      </button>
      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={anchorRef}
        aria-label="Folders"
      >
        <MenuItem>Runbooks</MenuItem>
      </Menu>
    </Modal>
  )
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Toggleable />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders an accessible dialog capped to the viewport', () => {
    render(<Harness onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'New diagram' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // jsdom normalizes the calc order, so check the parts.
    expect(dialog.style.width).toMatch(/^min\(940px, .*100vw/)
    expect(dialog.style.width).toContain('32px')
    expect(dialog.style.height).toMatch(/^min\(712px, .*100vh/)
  })

  it('moves focus inside on open and restores it on close', () => {
    render(<Toggleable />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on a press on the overlay but not inside the dialog', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.mouseDown(screen.getByRole('button', { name: 'First' }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('traps Tab focus inside the dialog', () => {
    render(<Harness onClose={vi.fn()} />)
    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('lets Escape close a nested menu before the dialog', () => {
    const onClose = vi.fn()
    render(<WithMenu onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Folder' }))
    fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
