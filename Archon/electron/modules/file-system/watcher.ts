import { watch, type FSWatcher } from 'chokidar'
import type { Stats } from 'fs'
import { relative, sep } from 'path'
import { fileKindFromPath } from '@/core/constants/file-extensions'
import { isOwnWrite } from './own-writes'
import { toRelPath } from './paths'

export const TREE_CHANGED_DEBOUNCE_MS = 150

export type WatchEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'

export interface WatchEvent {
  type: WatchEventType
  relPath: string
  /** Written by the app itself a moment ago. */
  own: boolean
}

export interface WatcherCallbacks {
  /** Debounced; not fired for the app's own writes. */
  onTreeChanged: () => void
  /** Every relevant event, including own writes (the consumer decides). */
  onFileEvent?: (event: WatchEvent) => void
}

let watcher: FSWatcher | null = null
let timer: NodeJS.Timeout | undefined

function isIgnored(root: string, path: string, stats?: Stats): boolean {
  const rel = relative(root, path)
  if (rel === '') return false
  if (rel.split(sep).some((part) => part.startsWith('.'))) return true
  return stats?.isFile() === true && fileKindFromPath(path) === null
}

function isRelevant(type: WatchEventType, path: string): boolean {
  return type === 'addDir' || type === 'unlinkDir' || fileKindFromPath(path) !== null
}

export async function startWatcher(root: string, callbacks: WatcherCallbacks): Promise<void> {
  await stopWatcher()

  const scheduleTreeChanged = (): void => {
    clearTimeout(timer)
    timer = setTimeout(callbacks.onTreeChanged, TREE_CHANGED_DEBOUNCE_MS)
  }

  const instance = watch(root, {
    ignoreInitial: true,
    followSymlinks: false,
    // Short: the tree should follow external changes within ~200ms.
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 },
    ignored: (path, stats) => isIgnored(root, path, stats)
  })

  instance.on('all', (type, path) => {
    if (!isRelevant(type as WatchEventType, path)) return
    const own = isOwnWrite(path)
    callbacks.onFileEvent?.({ type: type as WatchEventType, relPath: toRelPath(root, path), own })
    if (!own) scheduleTreeChanged()
  })
  instance.on('error', (error) => console.error('[watcher]', error))

  watcher = instance
  await new Promise<void>((resolve) => instance.once('ready', () => resolve()))
}

export async function stopWatcher(): Promise<void> {
  clearTimeout(timer)
  const closing = watcher
  watcher = null
  await closing?.close()
}
