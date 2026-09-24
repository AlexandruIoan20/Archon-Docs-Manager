import { realpath } from 'fs/promises'
import { dirname, isAbsolute, join, relative, sep } from 'path'
import { AppError, isErrno } from '../errors'

const outside = (relPath: unknown): AppError =>
  new AppError('PATH_OUTSIDE_WORKSPACE', `Path is outside the workspace: ${String(relPath)}`)

/** Absolute on any OS: `/x`, `\\x`, `C:\\x`, `C:/x`, `\\\\server\\share`. */
function looksAbsolute(path: string): boolean {
  return isAbsolute(path) || /^[a-zA-Z]:/.test(path) || /^[\\/]/.test(path)
}

/** `a\\b/./c` → `a/b/c`; rejects `..` segments. */
export function normalizeRelPath(relPath: unknown): string {
  if (typeof relPath !== 'string' || relPath.includes('\0')) throw outside(relPath)
  if (looksAbsolute(relPath)) throw outside(relPath)
  const segments = relPath.split(/[\\/]+/).filter((part) => part !== '' && part !== '.')
  if (segments.includes('..')) throw outside(relPath)
  return segments.join('/')
}

function isInside(root: string, target: string): boolean {
  const rel = relative(root, target)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/** Real path of `target`, or of its closest existing ancestor (for paths about to be created). */
async function realExistingPath(target: string): Promise<string> {
  let current = target
  for (;;) {
    try {
      const real = await realpath(current)
      return join(real, relative(current, target))
    } catch (error) {
      const parent = dirname(current)
      if (!isErrno(error, 'ENOENT') || parent === current) throw error
      current = parent
    }
  }
}

/**
 * The only way a renderer-supplied path reaches the disk. The path must be
 * relative, must not climb with `..`, and must stay inside the root even after
 * resolving symlinks. `root` must already be a real path.
 */
export async function resolveInWorkspace(root: string, relPath: unknown): Promise<string> {
  const normalized = normalizeRelPath(relPath)
  const target = join(root, ...normalized.split('/'))
  if (!isInside(root, target)) throw outside(relPath)
  if (!isInside(root, await realExistingPath(target))) throw outside(relPath)
  return target
}

/** Absolute path → workspace-relative, `/`-separated. */
export function toRelPath(root: string, absolute: string): string {
  return relative(root, absolute).split(sep).join('/')
}

/** Dot-files and dot-folders never show up in the tree. */
export function isHidden(name: string): boolean {
  return name.startsWith('.')
}

/** Parent folder of a relative path (`''` for top-level entries). */
export function parentRel(relPath: string): string {
  const index = relPath.lastIndexOf('/')
  return index === -1 ? '' : relPath.slice(0, index)
}

export function joinRel(folderRel: string, name: string): string {
  return folderRel === '' ? name : `${folderRel}/${name}`
}
