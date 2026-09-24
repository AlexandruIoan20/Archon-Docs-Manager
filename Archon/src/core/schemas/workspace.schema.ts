import { z } from 'zod'
import { isoDate } from './common.schema'
import { diagramTypeSchema } from './diagram.schema'

export const WORKSPACE_FORMAT_VERSION = '1.0.0'
export const WORKSPACE_FILE_NAME = 'workspace.soarws'

export const workspaceSettingsSchema = z.object({
  /** `inherit` follows the app preference; otherwise it overrides it for this workspace. */
  theme: z.enum(['inherit', 'dark', 'light']).default('inherit'),
  defaultDiagramType: diagramTypeSchema.default('flowchart')
})

/** `.soarws`: the file that marks a folder as a workspace. */
export const workspaceFileSchema = z.object({
  version: z.string().min(1),
  /** Stable identity: the SQLite index is keyed by it, so moving the folder keeps the index. */
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  created: isoDate,
  lastModified: isoDate,
  settings: workspaceSettingsSchema.default({ theme: 'inherit', defaultDiagramType: 'flowchart' })
})

export type WorkspaceFile = z.infer<typeof workspaceFileSchema>
