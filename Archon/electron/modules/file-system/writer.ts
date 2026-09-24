import { randomBytes } from 'crypto'
import { mkdir, rename, rm, writeFile } from 'fs/promises'
import { basename, dirname, join } from 'path'
import { markOwnWrite } from './own-writes'

/**
 * Writes JSON through a hidden temp file in the same folder, then renames it:
 * a crash never leaves a half-written file, and the temp file is invisible to
 * the tree (dot-file).
 */
export async function writeJsonAtomic(absolutePath: string, data: unknown): Promise<void> {
  const tmp = join(
    dirname(absolutePath),
    `.${basename(absolutePath)}.${randomBytes(4).toString('hex')}.tmp`
  )
  markOwnWrite(absolutePath)
  try {
    await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    await rename(tmp, absolutePath)
  } catch (error) {
    await rm(tmp, { force: true })
    throw error
  }
}

export async function ensureDir(absolutePath: string): Promise<void> {
  await mkdir(absolutePath, { recursive: true })
}
