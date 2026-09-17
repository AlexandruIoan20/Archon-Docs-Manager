import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Toggle } from '../Toggle'

function ControlledToggle({ disabled }: { disabled?: boolean }): React.JSX.Element {
  const [checked, setChecked] = useState(false)
  return (
    <Toggle checked={checked} onChange={setChecked} label="Retry on fail" disabled={disabled} />
  )
}

describe('Toggle', () => {
  it('exposes switch semantics', () => {
    render(<ControlledToggle />)
    const toggle = screen.getByRole('switch', { name: 'Retry on fail' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles on click', () => {
    render(<ControlledToggle />)
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('toggles once per Space press', () => {
    render(<ControlledToggle />)
    const toggle = screen.getByRole('switch')
    fireEvent.keyDown(toggle, { key: ' ' })
    fireEvent.keyUp(toggle, { key: ' ' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('ignores Space when disabled', () => {
    render(<ControlledToggle disabled />)
    const toggle = screen.getByRole('switch')
    fireEvent.keyDown(toggle, { key: ' ' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
