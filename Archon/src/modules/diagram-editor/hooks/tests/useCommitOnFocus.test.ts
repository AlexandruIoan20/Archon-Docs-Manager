import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCommitOnFocus } from '../useCommitOnFocus'

describe('useCommitOnFocus', () => {
  it('commits the first of five changes only', () => {
    const { result } = renderHook(() => useCommitOnFocus('N1'))
    act(() => result.current.onFocus())
    const commits = Array.from({ length: 5 }, () => result.current.takeCommit())
    expect(commits).toEqual([true, false, false, false, false])
  })

  it('starts a new session after blur and focus', () => {
    const { result } = renderHook(() => useCommitOnFocus('N1'))
    result.current.onFocus()
    result.current.takeCommit()
    result.current.onBlur()
    result.current.onFocus()
    expect(result.current.takeCommit()).toBe(true)
    expect(result.current.takeCommit()).toBe(false)
  })

  it('starts a new session for another key', () => {
    const { result, rerender } = renderHook(({ id }) => useCommitOnFocus(id), {
      initialProps: { id: 'N1' }
    })
    result.current.takeCommit()
    rerender({ id: 'N2' })
    expect(result.current.takeCommit()).toBe(true)
  })
})
