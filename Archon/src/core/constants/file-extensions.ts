import type { FileKind } from '@/core/types/editor.types'

export const FILE_EXTENSIONS = {
  workspace: '.arws',
  document: '.ardoc',
  diagram: '.ardiag'
} as const

export const EXTENSION_BY_KIND: Record<FileKind, string> = {
  ardoc: FILE_EXTENSIONS.document,
  ardiag: FILE_EXTENSIONS.diagram
}

/** The editor kind for a file name or path, or `null` for anything else. */
export function fileKindFromPath(path: string): FileKind | null {
  const lower = path.toLowerCase()
  if (lower.endsWith(FILE_EXTENSIONS.document)) return 'ardoc'
  if (lower.endsWith(FILE_EXTENSIONS.diagram)) return 'ardiag'
  return null
}
