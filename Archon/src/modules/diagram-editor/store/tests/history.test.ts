import { describe, expect, it } from 'vitest'
import { createHistory } from '../history'

describe('createHistory', () => {
  const h = createHistory<number>(3)

  it('undoes and redoes symmetrically', () => {
    let history = h.snapshot(h.empty(), 1)
    history = h.snapshot(history, 2)
    // Current state 3.
    const back = h.undo(history, 3)
    expect(back?.state).toBe(2)
    const forward = h.redo(back!.history, 2)
    expect(forward?.state).toBe(3)
    expect(forward?.history).toEqual(history)
  })

  it('keeps only the last `limit` steps', () => {
    let history = h.empty()
    for (const n of [1, 2, 3, 4, 5]) history = h.snapshot(history, n)
    expect(history.past).toEqual([3, 4, 5])
  })

  it('forgets the redo steps on a new change', () => {
    let history = h.snapshot(h.empty(), 1)
    history = h.undo(history, 2)!.history
    expect(h.canRedo(history)).toBe(true)
    history = h.snapshot(history, 1)
    expect(h.canRedo(history)).toBe(false)
  })

  it('has nothing to undo or redo at first', () => {
    expect(h.undo(h.empty(), 0)).toBeNull()
    expect(h.redo(h.empty(), 0)).toBeNull()
    expect(h.canUndo(h.empty())).toBe(false)
  })
})
