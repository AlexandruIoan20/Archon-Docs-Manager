import type { z } from 'zod'
import type { workspaceSettingsSchema } from '@/core/schemas/workspace.schema'
import type { FileKind } from './editor.types'

export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>
export type WorkspaceThemeOverride = WorkspaceSettings['theme']

/**
 * What the renderer knows about the open workspace. No absolute path: every
 * file is addressed relative to the workspace root (the recent list is the
 * only place absolute paths reach the renderer).
 */
export interface WorkspaceInfo {
  id: string
  name: string
  /** Name of the root folder on disk. */
  rootName: string
  settings: WorkspaceSettings
}

export interface FolderEntry {
  kind: 'folder'
  name: string
  /** Relative to the workspace root, `/`-separated; `''` is the root. */
  relPath: string
  children: TreeEntry[]
}

export interface FileEntry {
  kind: FileKind
  /** File name with extension. */
  name: string
  /** File name without extension, as shown in the tree. */
  baseName: string
  relPath: string
}

export type TreeEntry = FolderEntry | FileEntry
