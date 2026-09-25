import { useEffect, useMemo, useRef } from 'react'

export interface CommitOnFocus {
  onFocus: () => void
  onBlur: () => void
  /** `true` for the first change of an editing session, then `false` until the next focus. */
  takeCommit: () => boolean
}

/**
 * One undo step per editing session of a field: the first change after focus
 * records it, the keystrokes after it do not. A new `key` (another node
 * selected) starts a new session too.
 */
export function useCommitOnFocus(key?: string): CommitOnFocus {
  const fresh = useRef(true)

  useEffect(() => {
    fresh.current = true
  }, [key])

  return useMemo(
    () => ({
      onFocus: () => {
        fresh.current = true
      },
      onBlur: () => {
        fresh.current = true
      },
      takeCommit: () => {
        const commit = fresh.current
        fresh.current = false
        return commit
      }
    }),
    []
  )
}
