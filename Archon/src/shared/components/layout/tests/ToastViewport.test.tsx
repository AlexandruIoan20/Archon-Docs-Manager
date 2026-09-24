import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useUiStore } from '@/store'
import { TOAST_DURATION_MS, ToastViewport } from '../ToastViewport'

const initialState = useUiStore.getState()
const notify = (message: string, tone?: 'info' | 'error'): void =>
  act(() => useUiStore.getState().notify(message, tone))

describe('ToastViewport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useUiStore.setState(initialState, true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a polite live region mounted even without a toast', () => {
    const { container } = render(<ToastViewport />)
    expect(container.firstElementChild).toHaveAttribute('aria-live', 'polite')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a toast and hides it after 1900ms', () => {
    render(<ToastViewport />)
    notify('Folder created')
    expect(screen.getByRole('status')).toHaveTextContent('Folder created')

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1))
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(useUiStore.getState().toast).toBeNull()
  })

  it('replaces the current toast and restarts the timer', () => {
    render(<ToastViewport />)
    notify('Node added')
    act(() => vi.advanceTimersByTime(1500))

    notify('Edge created')
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Edge created')

    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByRole('status')).toHaveTextContent('Edge created')
    act(() => vi.advanceTimersByTime(400))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('restarts the timer for a repeated message', () => {
    render(<ToastViewport />)
    notify('Nothing to undo')
    act(() => vi.advanceTimersByTime(1500))
    notify('Nothing to undo')
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to undo')
  })

  it('announces errors as alerts, with the full text in the title', () => {
    render(<ToastViewport />)
    const message = 'Export failed: the destination folder is read-only'
    notify(message, 'error')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('title', message)
    expect(alert).toHaveAttribute('data-tone', 'error')
  })
})
