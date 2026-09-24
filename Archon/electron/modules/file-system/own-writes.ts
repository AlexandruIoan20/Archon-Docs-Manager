/**
 * Paths the app itself just wrote. The watcher skips their events: the
 * renderer already refreshed after its own mutation and the index was updated
 * directly, so a second round trip would only cause needless reloads.
 */
const OWN_WRITE_TTL_MS = 1500

const marks = new Map<string, number>()

export function markOwnWrite(absolutePath: string, now = Date.now()): void {
  marks.set(absolutePath, now + OWN_WRITE_TTL_MS)
}

export function isOwnWrite(absolutePath: string, now = Date.now()): boolean {
  const expires = marks.get(absolutePath)
  if (expires === undefined) return false
  if (expires < now) {
    marks.delete(absolutePath)
    return false
  }
  return true
}

export function clearOwnWrites(): void {
  marks.clear()
}
