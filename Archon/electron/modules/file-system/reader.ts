import { readdir, readFile } from 'fs/promises'
import { basename, join } from 'path'
import type { z } from 'zod'
import type { FileEntry, FolderEntry, TreeEntry } from '@/core/types'
import { fileKindFromPath } from '@/core/constants/file-extensions'
import { AppError, isErrno } from '../errors'
import { isHidden, joinRel } from './paths'

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

/** Folders first, then files; alphabetical, case-insensitive, numbers in order. */
function compareEntries(a: TreeEntry, b: TreeEntry): number {
  const aFolder = a.kind === 'folder'
  const bFolder = b.kind === 'folder'
  if (aFolder !== bFolder) return aFolder ? -1 : 1
  return collator.compare(a.name, b.name) || a.name.localeCompare(b.name)
}

async function readFolder(absolute: string, relPath: string, name: string): Promise<FolderEntry> {
  const dirents = await readdir(absolute, { withFileTypes: true })
  const children: TreeEntry[] = []

  for (const dirent of dirents) {
    // Symlinks are skipped: they could point outside the workspace.
    if (isHidden(dirent.name) || dirent.isSymbolicLink()) continue
    const childRel = joinRel(relPath, dirent.name)
    if (dirent.isDirectory()) {
      children.push(await readFolder(join(absolute, dirent.name), childRel, dirent.name))
      continue
    }
    const kind = dirent.isFile() ? fileKindFromPath(dirent.name) : null
    if (!kind) continue // Anything that is not a .soardoc / .soardiag stays out of the tree.
    const file: FileEntry = {
      kind,
      name: dirent.name,
      baseName: dirent.name.slice(0, dirent.name.lastIndexOf('.')),
      relPath: childRel
    }
    children.push(file)
  }

  children.sort(compareEntries)
  return { kind: 'folder', name, relPath, children }
}

/** The workspace tree; the root entry has `relPath: ''` and the root folder's name. */
export function readTree(root: string): Promise<FolderEntry> {
  return readFolder(root, '', basename(root))
}

/** Reads and validates a JSON file. Fails with `NOT_FOUND` or `INVALID_FILE`. */
export async function readJson<S extends z.ZodType>(
  absolutePath: string,
  schema: S,
  label = basename(absolutePath)
): Promise<z.infer<S>> {
  let text: string
  try {
    text = await readFile(absolutePath, 'utf8')
  } catch (error) {
    if (isErrno(error, 'ENOENT')) throw new AppError('NOT_FOUND', `${label} does not exist`)
    throw error
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error) {
    throw new AppError('INVALID_FILE', `${label} is not valid JSON`, String(error))
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
    throw new AppError('INVALID_FILE', `${label} has an invalid format`, issues)
  }
  return parsed.data
}
