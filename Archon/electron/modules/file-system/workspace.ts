import { randomUUID } from 'crypto'
import { realpath, stat } from 'fs/promises'
import { basename, dirname, join } from 'path'
import type { WorkspaceInfo, WorkspaceSettings } from '@/core/types'
import {
  WORKSPACE_FILE_NAME,
  WORKSPACE_FORMAT_VERSION,
  workspaceFileSchema,
  workspaceSettingsSchema,
  type WorkspaceFile
} from '@/core/schemas/workspace.schema'
import { FILE_EXTENSIONS } from '@/core/constants/file-extensions'
import { AppError, isErrno } from '../errors'
import { readJson } from './reader'
import { writeJsonAtomic } from './writer'

export interface OpenWorkspace {
  /** Real (symlink-free) absolute path of the workspace folder. */
  root: string
  /** Absolute path of the `.soarws` file. */
  filePath: string
  file: WorkspaceFile
}

export interface WorkspaceLifecycleListener {
  opened?: (workspace: OpenWorkspace) => void | Promise<void>
  closed?: (workspace: OpenWorkspace) => void | Promise<void>
}

let current: OpenWorkspace | null = null
const listeners = new Set<WorkspaceLifecycleListener>()

/** Lets the watcher and the index follow the open workspace without being imported here. */
export function onWorkspaceLifecycle(listener: WorkspaceLifecycleListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function emit(event: 'opened' | 'closed', workspace: OpenWorkspace): Promise<void> {
  for (const listener of listeners) {
    try {
      await listener[event]?.(workspace)
    } catch (error) {
      console.error(`[workspace] ${event} listener failed`, error)
    }
  }
}

export function toInfo({ root, file }: OpenWorkspace): WorkspaceInfo {
  return { id: file.id, name: file.name, rootName: basename(root), settings: file.settings }
}

export function getCurrent(): OpenWorkspace | null {
  return current
}

export function requireCurrent(): OpenWorkspace {
  if (!current) throw new AppError('NO_WORKSPACE', 'No workspace is open')
  return current
}

async function statOrNull(path: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(path)
  } catch (error) {
    if (isErrno(error, 'ENOENT')) return null
    throw error
  }
}

async function activate(workspace: OpenWorkspace): Promise<OpenWorkspace> {
  await closeWorkspace()
  current = workspace
  await emit('opened', workspace)
  return workspace
}

/** Accepts a `.soarws` file or the folder that contains `workspace.soarws`. */
export async function openWorkspace(path: string): Promise<OpenWorkspace> {
  const info = await statOrNull(path)
  if (!info) throw new AppError('NOT_FOUND', `${path} does not exist`)

  let filePath: string
  if (info.isDirectory()) {
    filePath = join(path, WORKSPACE_FILE_NAME)
    if (!(await statOrNull(filePath))?.isFile()) {
      throw new AppError('NOT_FOUND', `${basename(path)} does not contain ${WORKSPACE_FILE_NAME}`)
    }
  } else if (path.toLowerCase().endsWith(FILE_EXTENSIONS.workspace)) {
    filePath = path
  } else {
    throw new AppError('INVALID_FILE', `${basename(path)} is not a workspace file`)
  }

  const file = await readJson(filePath, workspaceFileSchema)
  const root = await realpath(dirname(filePath))
  return activate({ root, filePath: join(root, basename(filePath)), file })
}

/** Turns an existing folder into a workspace and opens it. */
export async function createWorkspace(
  dir: string,
  name: string,
  now = new Date()
): Promise<OpenWorkspace> {
  const trimmed = name.trim() || basename(dir)
  if (trimmed.length > 120) throw new AppError('INVALID_NAME', 'Workspace name is too long')
  if (!(await statOrNull(dir))?.isDirectory()) {
    throw new AppError('NOT_FOUND', `${dir} is not a folder`)
  }
  const filePath = join(dir, WORKSPACE_FILE_NAME)
  if (await statOrNull(filePath)) {
    throw new AppError('ALREADY_EXISTS', `${basename(dir)} already contains a workspace`)
  }

  const timestamp = now.toISOString()
  const file: WorkspaceFile = workspaceFileSchema.parse({
    version: WORKSPACE_FORMAT_VERSION,
    id: randomUUID(),
    name: trimmed,
    created: timestamp,
    lastModified: timestamp,
    settings: workspaceSettingsSchema.parse({})
  })
  await writeJsonAtomic(filePath, file)
  const root = await realpath(dir)
  return activate({ root, filePath: join(root, WORKSPACE_FILE_NAME), file })
}

export async function updateWorkspaceSettings(
  patch: Partial<WorkspaceSettings>,
  now = new Date()
): Promise<OpenWorkspace> {
  const workspace = requireCurrent()
  const settings = workspaceSettingsSchema.safeParse({ ...workspace.file.settings, ...patch })
  if (!settings.success) throw new AppError('INVALID_ARGUMENT', 'Invalid workspace settings')

  const file = { ...workspace.file, settings: settings.data, lastModified: now.toISOString() }
  await writeJsonAtomic(workspace.filePath, file)
  current = { ...workspace, file }
  return current
}

export async function closeWorkspace(): Promise<void> {
  const closing = current
  if (!closing) return
  current = null
  await emit('closed', closing)
}
