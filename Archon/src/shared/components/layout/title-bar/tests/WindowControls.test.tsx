import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createSoarApiMock, type SoarApiMock } from '@/test/soar-api-mock'
import { WindowControls } from '../WindowControls'

describe('WindowControls', () => {
  let mock: SoarApiMock

  beforeEach(() => {
    mock = createSoarApiMock()
    window.soar = mock.api
  })

  afterEach(() => {
    delete window.soar
  })

  it('calls the window IPC for each button', () => {
    render(<WindowControls />)

    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }))
    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(mock.api.window.minimize).toHaveBeenCalledOnce()
    expect(mock.api.window.toggleMaximize).toHaveBeenCalledOnce()
    expect(mock.api.window.close).toHaveBeenCalledOnce()
  })

  it('reads the initial maximized state', async () => {
    mock.api.window.isMaximized.mockResolvedValue(true)
    render(<WindowControls />)

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument()
  })

  it('follows maximize changes pushed by main', async () => {
    render(<WindowControls />)
    await act(async () => {})

    act(() => mock.emit('window:maximized-changed', true))
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()

    act(() => mock.emit('window:maximized-changed', false))
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = render(<WindowControls />)
    expect(mock.listenerCount('window:maximized-changed')).toBe(1)

    unmount()
    expect(mock.listenerCount('window:maximized-changed')).toBe(0)
  })
})
