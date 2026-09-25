import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderMermaid = vi.hoisted(() =>
  vi.fn((source: string) =>
    Promise.resolve(
      source.includes('bad')
        ? { error: { message: 'Parse error on line 2:', line: 2 } }
        : { svg: `<svg>${source}</svg>` }
    )
  )
)
vi.mock('../../mermaid/mermaid-loader', () => ({ renderMermaid }))

const { MERMAID_RENDER_DELAY_MS, useMermaidRender } = await import('../useMermaidRender')

const flush = (): Promise<void> => act(async () => undefined)
const wait = (ms: number): Promise<void> =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

describe('useMermaidRender', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    renderMermaid.mockClear()
    document.documentElement.dataset.theme = 'dark'
  })

  afterEach(() => {
    vi.useRealTimers()
    delete document.documentElement.dataset.theme
  })

  it('renders the first source at once', async () => {
    const { result } = renderHook(() => useMermaidRender('graph A'))
    expect(result.current.loading).toBe(true)
    await flush()
    expect(result.current).toEqual({ svg: '<svg>graph A</svg>', error: null, loading: false })
  })

  it('renders once, 300ms after the last change', async () => {
    const { result, rerender } = renderHook(({ source }) => useMermaidRender(source), {
      initialProps: { source: 'a' }
    })
    await flush()
    rerender({ source: 'ab' })
    rerender({ source: 'abc' })
    await wait(MERMAID_RENDER_DELAY_MS - 1)
    expect(renderMermaid).toHaveBeenCalledTimes(1)
    await wait(1)
    expect(renderMermaid).toHaveBeenCalledTimes(2)
    expect(renderMermaid).toHaveBeenLastCalledWith('abc', expect.any(Object))
    expect(result.current.svg).toBe('<svg>abc</svg>')
  })

  it('keeps the last valid SVG while the source has an error', async () => {
    const { result, rerender } = renderHook(({ source }) => useMermaidRender(source), {
      initialProps: { source: 'good' }
    })
    await flush()
    rerender({ source: 'bad' })
    await wait(MERMAID_RENDER_DELAY_MS)
    expect(result.current.svg).toBe('<svg>good</svg>')
    expect(result.current.error).toEqual({ message: 'Parse error on line 2:', line: 2 })

    rerender({ source: 'good again' })
    await wait(MERMAID_RENDER_DELAY_MS)
    expect(result.current).toMatchObject({ svg: '<svg>good again</svg>', error: null })
  })

  it('renders again when the theme changes', async () => {
    renderHook(() => useMermaidRender('graph A'))
    await flush()
    expect(renderMermaid).toHaveBeenLastCalledWith(
      'graph A',
      expect.objectContaining({ darkMode: true })
    )
    await act(async () => {
      document.documentElement.dataset.theme = 'light'
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(renderMermaid).toHaveBeenCalledTimes(2)
    expect(renderMermaid).toHaveBeenLastCalledWith(
      'graph A',
      expect.objectContaining({ darkMode: false })
    )
  })
})
