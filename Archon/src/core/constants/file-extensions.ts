import type { FileKind } from '@/core/types/editor.types'

export const FILE_EXTENSIONS = {
  workspace: '.soarws',
  document: '.soardoc',
  diagram: '.soardiag'
} as const

export const EXTENSION_BY_KIND: Record<FileKind, string> = {
  soardoc: FILE_EXTENSIONS.document,
  soardiag: FILE_EXTENSIONS.diagram
}

/** The editor kind for a file name or path, or `null` for anything else. */
export function fileKindFromPath(path: string): FileKind | null {
  const lower = path.toLowerCase()
  if (lower.endsWith(FILE_EXTENSIONS.document)) return 'soardoc'
  if (lower.endsWith(FILE_EXTENSIONS.diagram)) return 'soardiag'
  return null
}
