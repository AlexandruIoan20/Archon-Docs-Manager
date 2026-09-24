export interface HistoryState<T> {
  past: T[]
  future: T[]
}

export interface History<T> {
  empty: () => HistoryState<T>
  /** Records `state` before a change; any new change forgets the redo steps. */
  snapshot: (history: HistoryState<T>, state: T) => HistoryState<T>
  /** The state to go back to, with `current` kept for redo; `null` when there is none. */
  undo: (history: HistoryState<T>, current: T) => { history: HistoryState<T>; state: T } | null
  redo: (history: HistoryState<T>, current: T) => { history: HistoryState<T>; state: T } | null
  canUndo: (history: HistoryState<T>) => boolean
  canRedo: (history: HistoryState<T>) => boolean
}

/** Undo/redo over whole snapshots, keeping the last `limit` steps. Pure functions. */
export function createHistory<T>(limit = 30): History<T> {
  const keep = (items: T[]): T[] => items.slice(-limit)
  return {
    empty: () => ({ past: [], future: [] }),
    snapshot: (history, state) => ({ past: keep([...history.past, state]), future: [] }),
    undo: (history, current) => {
      const state = history.past.at(-1)
      if (state === undefined) return null
      return {
        history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
        state
      }
    },
    redo: (history, current) => {
      const [state, ...future] = history.future
      if (state === undefined) return null
      return { history: { past: keep([...history.past, current]), future }, state }
    },
    canUndo: (history) => history.past.length > 0,
    canRedo: (history) => history.future.length > 0
  }
}
