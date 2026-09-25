// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeJsonAtomic } from './writer'
import { startWatcher, stopWatcher, type WatchEvent } from './watcher'

const WAIT = { timeout: 3000, interval: 25 }

describe('watcher', () => {
  let root: string
  let onTreeChanged: Mock<() => void>
  let events: WatchEvent[]

  beforeEach(async () => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'ar-watch-')))
    onTreeChanged = vi.fn<() => void>()
    events = []
    await startWatcher(root, { onTreeChanged, onFileEvent: (event) => events.push(event) })
  })

  afterEach(async () => {
    await stopWatcher()
    rmSync(root, { recursive: true, force: true })
  })

  it('reports files created and deleted outside the app', async () => {
    writeFileSync(join(root, 'outside.ardoc'), '{}')
    await vi.waitFor(() => expect(onTreeChanged).toHaveBeenCalledOnce(), WAIT)
    expect(events).toContainEqual({ type: 'add', relPath: 'outside.ardoc', own: false })

    unlinkSync(join(root, 'outside.ardoc'))
    await vi.waitFor(() => expect(onTreeChanged).toHaveBeenCalledTimes(2), WAIT)
    expect(events).toContainEqual({ type: 'unlink', relPath: 'outside.ardoc', own: false })
  })

  it('debounces bursts into one notification', async () => {
    for (let i = 0; i < 5; i++) writeFileSync(join(root, `burst-${i}.ardiag`), '{}')
    await vi.waitFor(() => expect(events.filter((e) => e.type === 'add')).toHaveLength(5), WAIT)
    await vi.waitFor(() => expect(onTreeChanged).toHaveBeenCalled(), WAIT)
    expect(onTreeChanged).toHaveBeenCalledOnce()
  })

  it('reports folders', async () => {
    mkdirSync(join(root, 'Runbooks'))
    await vi.waitFor(
      () => expect(events).toContainEqual({ type: 'addDir', relPath: 'Runbooks', own: false }),
      WAIT
    )
  })

  it('ignores hidden and foreign files', async () => {
    writeFileSync(join(root, 'notes.md'), 'x')
    mkdirSync(join(root, '.git'))
    writeFileSync(join(root, '.git', 'x.ardoc'), '{}')
    writeFileSync(join(root, 'marker.ardoc'), '{}')

    await vi.waitFor(() => expect(onTreeChanged).toHaveBeenCalled(), WAIT)
    expect(events.map((event) => event.relPath)).toEqual(['marker.ardoc'])
  })

  it('flags the app’s own writes and does not refresh the tree for them', async () => {
    await writeJsonAtomic(join(root, 'own.ardoc'), { title: 'x' })
    await vi.waitFor(
      () => expect(events).toContainEqual({ type: 'add', relPath: 'own.ardoc', own: true }),
      WAIT
    )
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(onTreeChanged).not.toHaveBeenCalled()
  })
})
