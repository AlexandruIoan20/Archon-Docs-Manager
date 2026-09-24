import { lstat } from 'fs/promises'
import { join } from 'path'
import type { FileKind, SoarDiagram, SoarDocument, TreeEntry } from '@/core/types'
import { fileKindFromPath } from '@/core/constants/file-extensions'
import { diagramFileSchema } from '@/core/schemas/diagram.schema'
import { documentFileSchema } from '@/core/schemas/document.schema'
import { isErrno } from '../errors'
import { isHidden } from '../file-system/paths'
import { readJson, readTree } from '../file-system/reader'

/** An app file on disk, with what the index compares to decide if it changed. */
export interface DiskFile {
  relPath: string
  kind: FileKind
  mtimeMs: number
  size: number
}

/** A file read for indexing; neither `doc` nor `diagram` when it could not be read. */
export interface ReadFile {
  file: DiskFile
  doc?: SoarDocument
  diagram?: SoarDiagram
}

const absolute = (root: string, relPath: string): string =>
  relPath === '' ? root : join(root, ...relPath.split('/'))

/** `relPath` is `scope` or lies under it; `''` is the whole workspace. */
export const inScope = (relPath: string, scope: string): boolean =>
  scope === '' || relPath === scope || relPath.startsWith(`${scope}/`)

function collectFiles(entry: TreeEntry, prefix: string, out: string[]): string[] {
  if (entry.kind !== 'folder') out.push(prefix ? `${prefix}/${entry.relPath}` : entry.relPath)
  else for (const child of entry.children) collectFiles(child, prefix, out)
  return out
}

async function statFile(root: string, relPath: string): Promise<DiskFile | null> {
  const kind = fileKindFromPath(relPath)
  if (!kind) return null
  try {
    // `lstat`: a symlink could point outside the workspace, so it is not indexed.
    const info = await lstat(absolute(root, relPath))
    return info.isFile()
      ? { relPath, kind, mtimeMs: Math.floor(info.mtimeMs), size: info.size }
      : null
  } catch (error) {
    if (isErrno(error, 'ENOENT')) return null
    throw error
  }
}

/**
 * App files on disk inside `scope` (a file, a folder or `''`), with the same
 * rules as the tree: hidden entries, symlinks and foreign files are left out.
 */
export async function listDisk(root: string, scope: string): Promise<DiskFile[]> {
  if (scope !== '' && scope.split('/').some(isHidden)) return []
  let info
  try {
    info = await lstat(absolute(root, scope))
  } catch (error) {
    if (isErrno(error, 'ENOENT')) return []
    throw error
  }
  if (!info.isDirectory()) {
    const file = await statFile(root, scope)
    return file ? [file] : []
  }
  const relPaths = collectFiles(await readTree(absolute(root, scope)), scope, [])
  const files = await Promise.all(relPaths.map((relPath) => statFile(root, relPath)))
  return files.filter((file): file is DiskFile => file !== null)
}

/** Reads and validates a file. A broken file is logged and returned without content. */
export async function readForIndex(root: string, file: DiskFile): Promise<ReadFile> {
  const path = absolute(root, file.relPath)
  try {
    return file.kind === 'soardoc'
      ? { file, doc: await readJson(path, documentFileSchema, file.relPath) }
      : { file, diagram: await readJson(path, diagramFileSchema, file.relPath) }
  } catch (error) {
    console.warn(`[index] skipped ${file.relPath}:`, (error as Error).message)
    return { file }
  }
}
