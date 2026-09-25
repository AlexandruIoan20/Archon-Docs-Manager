import { stat } from 'fs/promises'
import type { z } from 'zod'
import { AppError, isErrno } from '../errors'
import { isHidden, normalizeRelPath, resolveInWorkspace, toRelPath } from './paths'
import { readJson } from './reader'
import { writeJsonAtomic } from './writer'

/** A workspace folder that must already exist. */
export async function resolveFolder(root: string, folderRel: string): Promise<string> {
  const dir = await resolveInWorkspace(root, folderRel)
  try {
    if ((await stat(dir)).isDirectory()) return dir
  } catch (error) {
    if (!isErrno(error, 'ENOENT')) throw error
  }
  throw new AppError('NOT_FOUND', `Folder “${folderRel || '/'}” does not exist`)
}

/** A path to an app file of the given extension (`.ardoc` / `.ardiag`). */
export async function resolveAppFile(root: string, relPath: string, ext: string): Promise<string> {
  const normalized = normalizeRelPath(relPath)
  const name = normalized.split('/').pop() ?? ''
  if (!name.toLowerCase().endsWith(ext) || isHidden(name)) {
    throw new AppError('INVALID_ARGUMENT', `Expected a ${ext} file, got “${relPath}”`)
  }
  return resolveInWorkspace(root, normalized)
}

export interface JsonFileOps<S extends z.ZodType> {
  ext: string
  schema: S
  label: string
}

/** Reads an app file; `NOT_FOUND` / `INVALID_FILE` carry the relative path in the message. */
export async function readAppFile<S extends z.ZodType>(
  root: string,
  relPath: string,
  ops: JsonFileOps<S>
): Promise<z.infer<S>> {
  const path = await resolveAppFile(root, relPath, ops.ext)
  return readJson(path, ops.schema, relPath)
}

/**
 * Validates, then writes. Identity (`id`, `created`) stays as it is on disk;
 * `lastModified` is set here.
 */
export async function writeAppFile<S extends z.ZodType>(
  root: string,
  relPath: string,
  data: unknown,
  ops: JsonFileOps<S>,
  now = new Date()
): Promise<z.infer<S>> {
  const path = await resolveAppFile(root, relPath, ops.ext)
  let existing: { id: string; created: string } | null = null
  try {
    existing = (await readJson(path, ops.schema, relPath)) as { id: string; created: string }
  } catch (error) {
    // A new or broken file is overwritten with the validated content below.
    if (!(error instanceof AppError)) throw error
  }

  const candidate = {
    ...(data as object),
    ...(existing ? { id: existing.id, created: existing.created } : {}),
    lastModified: now.toISOString()
  }
  const parsed = ops.schema.safeParse(candidate)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
    throw new AppError('INVALID_ARGUMENT', `Refused to save an invalid ${ops.label}`, issues)
  }
  await writeJsonAtomic(path, parsed.data)
  return parsed.data
}

export interface EntryRefValue {
  relPath: string
  name: string
}

export function entryRef(root: string, absolutePath: string): EntryRefValue {
  const relPath = toRelPath(root, absolutePath)
  return { relPath, name: relPath.split('/').pop() ?? relPath }
}
