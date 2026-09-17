import { promises as fsp, readFileSync, renameSync, writeFileSync } from 'fs'
import type { AppSettings, SettingsPatch } from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings, normalizeSettings } from '@/core/settings/normalize-settings'

const serialize = (settings: AppSettings): string => `${JSON.stringify(settings, null, 2)}\n`

function isMissingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}

/**
 * App preferences backed by one JSON file.
 * - Reads once, lazily and synchronously: the window needs them before it exists.
 * - Invalid values fall back to defaults; unreadable JSON is set aside as
 *   `settings.corrupt-<timestamp>.json` so the user's file is never silently lost.
 * - Writes are atomic (`.tmp` + rename) and serialized; rapid updates coalesce.
 */
export class SettingsStore {
  private cache: AppSettings | null = null
  private chain: Promise<void> = Promise.resolve()
  private queued: Promise<void> | null = null

  constructor(
    private readonly filePath: string,
    private readonly now: () => number = Date.now
  ) {}

  get(): AppSettings {
    this.cache ??= this.load()
    return this.cache
  }

  /** Merges a partial update, validates it and schedules a write. */
  async update(patch: SettingsPatch): Promise<AppSettings> {
    const next = mergeSettings(this.get(), patch)
    this.cache = next
    await this.scheduleWrite()
    return next
  }

  /** Synchronous variant for shutdown paths, where async writes may never finish. */
  updateSync(patch: SettingsPatch): AppSettings {
    const next = mergeSettings(this.get(), patch)
    this.cache = next
    const tmp = `${this.filePath}.tmp`
    writeFileSync(tmp, serialize(next), 'utf8')
    renameSync(tmp, this.filePath)
    return next
  }

  /** Resolves once every scheduled write has reached the disk. */
  async flush(): Promise<void> {
    await this.chain
  }

  private load(): AppSettings {
    let text: string
    try {
      text = readFileSync(this.filePath, 'utf8')
    } catch (error) {
      if (isMissingFile(error)) return structuredClone(DEFAULT_SETTINGS)
      throw error
    }

    try {
      return normalizeSettings(JSON.parse(text))
    } catch {
      this.setAsideCorruptFile()
      return structuredClone(DEFAULT_SETTINGS)
    }
  }

  private setAsideCorruptFile(): void {
    const target = this.filePath.replace(/\.json$/, '') + `.corrupt-${this.now()}.json`
    try {
      renameSync(this.filePath, target)
    } catch (error) {
      console.error('[settings] could not set aside corrupt settings file', error)
    }
  }

  private scheduleWrite(): Promise<void> {
    // One pending write at a time: it serializes whatever the cache holds when it runs.
    if (this.queued) return this.queued
    const write = this.chain.then(async () => {
      this.queued = null
      const tmp = `${this.filePath}.tmp`
      await fsp.writeFile(tmp, serialize(this.get()), 'utf8')
      await fsp.rename(tmp, this.filePath)
    })
    this.queued = write
    this.chain = write.catch((error: unknown) => {
      console.error('[settings] write failed', error)
    })
    return write
  }
}
