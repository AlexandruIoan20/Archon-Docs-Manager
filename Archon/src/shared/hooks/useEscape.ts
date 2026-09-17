import { useEffect, useEffectEvent } from 'react'

type Entry = { run: () => void }

// Only the most recently opened layer reacts, so Escape inside a menu that
// sits in a modal closes the menu and leaves the modal open.
const stack: Entry[] = []

function handleKeyDown(event: KeyboardEvent): void {
  const top = stack[stack.length - 1]
  if (event.key !== 'Escape' || !top) return
  event.preventDefault()
  top.run()
}

export function useEscape(handler: () => void, enabled = true): void {
  const onEscape = useEffectEvent(handler)

  useEffect(() => {
    if (!enabled) return
    const entry: Entry = { run: () => onEscape() }
    if (stack.length === 0) document.addEventListener('keydown', handleKeyDown)
    stack.push(entry)

    return () => {
      stack.splice(stack.indexOf(entry), 1)
      if (stack.length === 0) document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])
}
