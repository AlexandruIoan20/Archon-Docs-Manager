// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { SettingsStore } from './settings'

describe('SettingsStore', () => {
  let dir: string
  let file: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ar-settings-'))
    file = join(dir, 'settings.json')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const readJson = (): unknown => JSON.parse(readFileSync(file, 'utf8'))

  it('returns the defaults when the file does not exist, without writing it', () => {
    const store = new SettingsStore(file)
    expect(store.get()).toEqual(DEFAULT_SETTINGS)
    expect(existsSync(file)).toBe(false)
  })

  it('replaces unknown values with defaults', () => {
    writeFileSync(file, JSON.stringify({ appearance: { theme: 'light', accent: 'pink' } }))
    const settings = new SettingsStore(file).get()
    expect(settings.appearance.theme).toBe('light')
    expect(settings.appearance.accent).toBe('#4F8EF7')
  })

  it('sets a corrupt file aside and starts from the defaults', () => {
    writeFileSync(file, '{ "appearance": ')
    const store = new SettingsStore(file, () => 1700000000000)

    expect(store.get()).toEqual(DEFAULT_SETTINGS)
    expect(existsSync(file)).toBe(false)
    const corrupt = join(dir, 'settings.corrupt-1700000000000.json')
    expect(readFileSync(corrupt, 'utf8')).toBe('{ "appearance": ')
  })

  it('persists a partial update atomically', async () => {
    const store = new SettingsStore(file)
    const next = await store.update({ appearance: { theme: 'light' } })

    expect(next.appearance.theme).toBe('light')
    expect(readJson()).toEqual(next)
    expect(readdirSync(dir)).toEqual(['settings.json'])
  })

  it('reloads what it wrote', async () => {
    await new SettingsStore(file).update({ layout: { sidebar: { width: 333, visible: false } } })
    expect(new SettingsStore(file).get().layout.sidebar).toEqual({ width: 333, visible: false })
  })

  it('validates updates before storing them', async () => {
    const store = new SettingsStore(file)
    await store.update({ appearance: { uiZoom: 9 }, layout: { inspector: { width: -5 } } })
    expect(store.get().appearance.uiZoom).toBe(1.5)
    expect(store.get().layout.inspector.width).toBe(220)
  })

  it('coalesces rapid updates and keeps the last state', async () => {
    const store = new SettingsStore(file)
    await Promise.all([
      store.update({ appearance: { theme: 'light' } }),
      store.update({ appearance: { accent: '#22C55E' } }),
      store.update({ appearance: { theme: 'system' } })
    ])
    await store.flush()

    expect(readJson()).toMatchObject({ appearance: { theme: 'system', accent: '#22C55E' } })
  })

  it('writes synchronously for shutdown paths', () => {
    const store = new SettingsStore(file)
    store.updateSync({ window: { maximized: true } })
    expect(readJson()).toMatchObject({ window: { maximized: true, bounds: null } })
  })

  it('keeps working after a failed write', async () => {
    const store = new SettingsStore(join(dir, 'missing-dir', 'settings.json'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(store.update({ appearance: { theme: 'light' } })).rejects.toThrow()
    await store.flush()
    expect(store.get().appearance.theme).toBe('light')
    spy.mockRestore()
  })
})
