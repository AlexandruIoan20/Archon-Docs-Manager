import { setImmediate as nextTick } from 'timers/promises'
import type { IndexProgress, IndexStatus } from '@/core/types'
import { normalizeRelPath } from '../file-system/paths'
import type { SqliteDatabase } from './db'
import { inScope, listDisk, readForIndex, type ReadFile } from './disk-scan'
import { createDiagramsRepo } from './repositories/diagrams.repo'
import { createDocumentsRepo } from './repositories/documents.repo'
import { createFileRows } from './repositories/file-rows'

export const INDEX_BATCH_SIZE = 50

export interface SyncReport {
  indexed: number
  removed: number
  unchanged: number
  skipped: number
}

export interface Indexer {
  /** Reindexes what changed since the last run (mtime/size) and drops what is gone. */
  fullSync: () => Promise<SyncReport>
  /**
   * Brings one file or folder (and everything under it) in line with the disk:
   * new and changed files are read, missing ones removed.
   */
  syncPath: (relPath: string, force?: boolean) => Promise<SyncReport>
  getStatus: () => IndexStatus
  /** Stops pending batches and waits for the running task to finish. */
  dispose: () => Promise<void>
}

export interface IndexerOptions {
  db: SqliteDatabase
  root: string
  onProgress?: (progress: IndexProgress) => void
  batchSize?: number
}

/**
 * Keeps the workspace index in step with the disk. Every operation runs on one
 * queue, so a full sync and incremental updates never interleave; reads are
 * async and writes go in one transaction per batch, yielding in between.
 */
export function createIndexer({
  db,
  root,
  onProgress,
  batchSize = INDEX_BATCH_SIZE
}: IndexerOptions): Indexer {
  const rows = createFileRows(db)
  const documents = createDocumentsRepo(db)
  const diagrams = createDiagramsRepo(db)
  const countFiles = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM files')

  let queue: Promise<unknown> = Promise.resolve()
  let disposed = false
  let indexing = false
  let skipped = 0
  let lastSync: string | null = null

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task)
    queue = run.catch(() => undefined)
    return run
  }

  const writeBatch = db.transaction((items: ReadFile[]) => {
    for (const { file, doc, diagram } of items) {
      if (doc) documents.upsert(file.relPath, doc, file)
      else if (diagram) diagrams.upsert(file.relPath, diagram, file)
      else rows.removeUnder(file.relPath)
    }
  })

  async function syncScope(scope: string, force: boolean, report: boolean): Promise<SyncReport> {
    const disk = await listDisk(root, scope)
    const known = new Map(
      rows
        .listStats()
        .filter((row) => inScope(row.relPath, scope))
        .map((row) => [row.relPath, row])
    )
    const result: SyncReport = { indexed: 0, removed: 0, unchanged: 0, skipped: 0 }

    const changed = disk.filter((file) => {
      const row = known.get(file.relPath)
      known.delete(file.relPath)
      const same = row && row.mtimeMs === file.mtimeMs && row.size === file.size
      if (same && !force) result.unchanged++
      return force || !same
    })
    for (const relPath of known.keys()) result.removed += rows.removeUnder(relPath)

    const total = changed.length
    for (let done = 0; done < total && !disposed; done += batchSize) {
      if (report) onProgress?.({ state: 'indexing', done, total })
      const items = await Promise.all(
        changed.slice(done, done + batchSize).map((file) => readForIndex(root, file))
      )
      if (disposed || !db.open) break
      writeBatch(items)
      for (const item of items) {
        if (item.doc || item.diagram) result.indexed++
        else result.skipped++
      }
      await nextTick()
    }
    return result
  }

  async function fullSync(): Promise<SyncReport> {
    indexing = true
    onProgress?.({ state: 'indexing', done: 0, total: 0 })
    try {
      const report = await syncScope('', false, true)
      skipped = report.skipped
      lastSync = new Date().toISOString()
      console.info(
        `[index] sync: ${report.indexed} indexed, ${report.unchanged} unchanged, ` +
          `${report.removed} removed, ${report.skipped} skipped`
      )
      return report
    } finally {
      indexing = false
      onProgress?.({ state: 'idle', done: 0, total: 0 })
    }
  }

  return {
    fullSync: () => enqueue(fullSync),
    syncPath: (relPath, force = false) =>
      enqueue(() => syncScope(normalizeRelPath(relPath), force, false)),
    getStatus: () => ({
      indexing,
      files: db.open ? (countFiles.get()?.count ?? 0) : 0,
      skipped,
      lastSync
    }),
    dispose: async () => {
      disposed = true
      await queue
    }
  }
}
