import { lstat, mkdir, rename } from 'fs/promises'
import { basename, dirname, extname, join } from 'path'
import { fileKindFromPath } from '@/core/constants/file-extensions'
import { AppError, isErrno } from '../errors'
import { entryRef, resolveFolder, type EntryRefValue } from './file-helpers'
import { assertValidFileName, nextAvailableName } from './naming'
import { markOwnWrite } from './own-writes'
import { isHidden, normalizeRelPath, resolveInWorkspace } from './paths'

export type TrashFn = (absolutePath: string) => Promise<void>

interface Entry {
  path: string
  rel: string
  isFolder: boolean
}

/** A folder or an app file: never the root, `workspace.soarws` or hidden files. */
async function resolveEntry(root: string, relPath: string): Promise<Entry> {
  const rel = normalizeRelPath(relPath)
  if (rel === '') throw new AppError('INVALID_ARGUMENT', 'The workspace root cannot be changed')
  const path = await resolveInWorkspace(root, rel)

  let info
  try {
    info = await lstat(path)
  } catch (error) {
    if (isErrno(error, 'ENOENT')) throw new AppError('NOT_FOUND', `“${rel}” does not exist`)
    throw error
  }
  const isFolder = info.isDirectory()
  const supported = isFolder || (info.isFile() && fileKindFromPath(path) !== null)
  if (!supported || isHidden(basename(path))) {
    throw new AppError('INVALID_ARGUMENT', `“${rel}” is not a workspace file or folder`)
  }
  return { path, rel, isFolder }
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  } catch (error) {
    if (isErrno(error, 'ENOENT')) return false
    throw error
  }
}

async function moveOnDisk(from: string, to: string): Promise<void> {
  // A case-only rename points at the same entry on case-insensitive disks.
  const caseOnly = from.toLowerCase() === to.toLowerCase()
  if (!caseOnly && (await exists(to))) {
    throw new AppError('ALREADY_EXISTS', `“${basename(to)}” already exists there`)
  }
  markOwnWrite(from)
  markOwnWrite(to)
  await rename(from, to)
}

/** `new-folder-N`, or `name`, inside an existing folder. */
export async function createFolder(
  root: string,
  parentRel: string,
  name?: string
): Promise<EntryRefValue> {
  const dir = await resolveFolder(root, parentRel)
  const folderName = name?.trim() || (await nextAvailableName(dir, 'new-folder', ''))
  assertValidFileName(folderName)
  const path = join(dir, folderName)
  markOwnWrite(path)
  try {
    await mkdir(path)
  } catch (error) {
    if (isErrno(error, 'EEXIST')) {
      throw new AppError('ALREADY_EXISTS', `“${folderName}” already exists`)
    }
    throw error
  }
  return entryRef(root, path)
}

/** Files keep their extension: `newName` is the name shown in the tree. */
export async function renameEntry(
  root: string,
  relPath: string,
  newName: string
): Promise<EntryRefValue> {
  const entry = await resolveEntry(root, relPath)
  const ext = entry.isFolder ? '' : extname(entry.path)
  const trimmed = newName.trim()
  const base =
    ext && trimmed.toLowerCase().endsWith(ext.toLowerCase())
      ? trimmed.slice(0, -ext.length)
      : trimmed
  assertValidFileName(base)
  const fileName = `${base}${ext}`

  const target = join(dirname(entry.path), fileName)
  if (target !== entry.path) await moveOnDisk(entry.path, target)
  return entryRef(root, target)
}

export async function moveEntry(
  root: string,
  relPath: string,
  targetFolderRel: string
): Promise<EntryRefValue> {
  const entry = await resolveEntry(root, relPath)
  const folderRel = normalizeRelPath(targetFolderRel)
  if (entry.isFolder && (folderRel === entry.rel || folderRel.startsWith(`${entry.rel}/`))) {
    throw new AppError('INVALID_MOVE', 'A folder cannot be moved into itself')
  }
  const dir = await resolveFolder(root, folderRel)
  const target = join(dir, basename(entry.path))
  if (target !== entry.path) await moveOnDisk(entry.path, target)
  return entryRef(root, target)
}

/** Sends the entry to the system trash; nothing is deleted for good. */
export async function deleteEntry(root: string, relPath: string, trash: TrashFn): Promise<void> {
  const entry = await resolveEntry(root, relPath)
  markOwnWrite(entry.path)
  await trash(entry.path)
}
