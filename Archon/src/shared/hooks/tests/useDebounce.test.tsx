import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedCallback } from '../useDebounce'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs once, after the pause, with the last arguments', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 800))
    result.current('a')
    vi.advanceTimersByTime(500)
    result.current('b')
    vi.advanceTimersByTime(799)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledExactlyOnceWith('b')
  })

  it('flushes a pending call now, and does nothing without one', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 800))
    result.current.flush()
    expect(fn).not.toHaveBeenCalled()

    result.current(1)
    expect(result.current.isPending()).toBe(true)
    result.current.flush()
    expect(fn).toHaveBeenCalledExactlyOnceWith(1)
    expect(result.current.isPending()).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('cancels explicitly and on unmount', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 800))
    result.current()
    result.current.cancel()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()

    result.current()
    unmount()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('can flush instead of cancelling on unmount', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(fn, 800, { onUnmount: 'flush' })
    )
    result.current('last')
    unmount()
    expect(fn).toHaveBeenCalledExactlyOnceWith('last')
  })

  it('always calls the latest function and stays stable', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ fn }) => useDebouncedCallback(fn, 100), {
      initialProps: { fn: first }
    })
    const stable = result.current
    rerender({ fn: second })
    expect(result.current).toBe(stable)
    result.current()
    vi.advanceTimersByTime(100)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })
})
