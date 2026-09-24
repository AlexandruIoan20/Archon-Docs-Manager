import { useEffect, useEffectEvent, useMemo } from 'react'

export interface DebouncedCallback<A extends unknown[]> {
  (...args: A): void
  /** Runs a pending call now. */
  flush: () => void
  /** Drops a pending call. */
  cancel: () => void
  isPending: () => boolean
}

interface Debouncer<A extends unknown[]> {
  call: DebouncedCallback<A>
  /** What a call runs; set from an effect, so it can be an effect event. */
  setTarget: (target: ((...args: A) => void) | null) => void
}

function createDebouncer<A extends unknown[]>(ms: number): Debouncer<A> {
  let target: ((...args: A) => void) | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: A | undefined

  const run = (): void => {
    timer = undefined
    const args = lastArgs as A
    lastArgs = undefined
    target?.(...args)
  }
  const call = ((...args: A) => {
    lastArgs = args
    clearTimeout(timer)
    timer = setTimeout(run, ms)
  }) as DebouncedCallback<A>
  call.flush = () => {
    if (timer === undefined) return
    clearTimeout(timer)
    run()
  }
  call.cancel = () => {
    clearTimeout(timer)
    timer = undefined
    lastArgs = undefined
  }
  call.isPending = () => timer !== undefined

  return {
    call,
    setTarget: (next) => {
      target = next
    }
  }
}

/**
 * `fn` called `ms` after the last call, with the last call's arguments. The
 * returned function is stable; it always runs the latest `fn`. On unmount a
 * pending call is cancelled, or run at once with `onUnmount: 'flush'` (autosave).
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
  { onUnmount = 'cancel' }: { onUnmount?: 'cancel' | 'flush' } = {}
): DebouncedCallback<A> {
  const onRun = useEffectEvent((...args: A) => fn(...args))
  const debouncer = useMemo(() => createDebouncer<A>(ms), [ms])

  useEffect(() => {
    debouncer.setTarget((...args) => onRun(...args))
    const { call } = debouncer
    return () => {
      if (onUnmount === 'flush') call.flush()
      else call.cancel()
      debouncer.setTarget(null)
    }
  }, [debouncer, onUnmount])

  return debouncer.call
}
