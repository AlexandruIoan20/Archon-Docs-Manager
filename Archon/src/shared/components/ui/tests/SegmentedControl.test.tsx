import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SegmentedControl, type SegmentedOption } from '../SegmentedControl'

type Tab = 'files' | 'diagrams' | 'archive'

const OPTIONS: SegmentedOption<Tab>[] = [
  { value: 'files', label: 'Files', icon: 'folder' },
  { value: 'diagrams', label: 'Diagrams', icon: 'flow' },
  { value: 'archive', label: 'Archive', disabled: true }
]

function Harness({ variant }: { variant?: 'tabs' | 'pills' }): React.JSX.Element {
  const [value, setValue] = useState<Tab>('files')
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={setValue}
      variant={variant}
      aria-label="Sidebar view"
    />
  )
}

describe('SegmentedControl', () => {
  it('renders tabs with the selected one marked', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Sidebar view' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Diagrams' })).toHaveAttribute('aria-selected', 'false')
  })

  it('uses radio semantics for pills', () => {
    render(<Harness variant="pills" />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Files' })).toHaveAttribute('aria-checked', 'true')
  })

  it('selects on click', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('tab', { name: 'Diagrams' }))
    expect(screen.getByRole('tab', { name: 'Diagrams' })).toHaveAttribute('aria-selected', 'true')
  })

  it('keeps only the selected option in the tab order', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Diagrams' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection and focus with arrow keys, skipping disabled options', () => {
    render(<Harness />)
    const files = screen.getByRole('tab', { name: 'Files' })
    files.focus()

    fireEvent.keyDown(files, { key: 'ArrowRight' })
    const diagrams = screen.getByRole('tab', { name: 'Diagrams' })
    expect(diagrams).toHaveAttribute('aria-selected', 'true')
    expect(diagrams).toHaveFocus()

    fireEvent.keyDown(diagrams, { key: 'ArrowRight' })
    expect(files).toHaveAttribute('aria-selected', 'true')
    expect(files).toHaveFocus()

    fireEvent.keyDown(files, { key: 'ArrowLeft' })
    expect(diagrams).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps with Home and End', () => {
    render(<Harness />)
    const files = screen.getByRole('tab', { name: 'Files' })
    fireEvent.keyDown(files, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Diagrams' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(files, { key: 'Home' })
    expect(files).toHaveAttribute('aria-selected', 'true')
  })
})
