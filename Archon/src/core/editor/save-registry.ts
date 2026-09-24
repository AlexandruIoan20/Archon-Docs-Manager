/**
 * Save callbacks of open editors, by tab id. The tab system asks an editor to
 * save (unsaved-changes guard, quit) without importing the editor module: the
 * editor registers here while it is mounted.
 */
export type SaveHandler = () => Promise<boolean>

const handlers = new Map<string, SaveHandler>()

/** Returns the unregister function; a newer registration for the tab replaces this one. */
export function registerSaveHandler(tabId: string, handler: SaveHandler): () => void {
  handlers.set(tabId, handler)
  return () => {
    if (handlers.get(tabId) === handler) handlers.delete(tabId)
  }
}

/** True once the tab's content is on disk; false without a handler or if saving failed. */
export async function saveTab(tabId: string): Promise<boolean> {
  const handler = handlers.get(tabId)
  if (!handler) return false
  try {
    return await handler()
  } catch (error) {
    console.error(`[editor] saving ${tabId} failed`, error)
    return false
  }
}
