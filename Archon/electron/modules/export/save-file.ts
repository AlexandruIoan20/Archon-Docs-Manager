import { promises as fsp } from 'fs'
import { basename, dirname, join } from 'path'
import type { ExportExtension, ExportSaveResult } from '@/core/types'
import { AppError } from '../errors'

export const EXPORT_EXTENSIONS: readonly ExportExtension[] = ['png', 'svg', 'pdf', 'xmi']

const FILTERS: Record<ExportExtension, { name: string; extensions: string[] }> = {
  png: { name: 'PNG image', extensions: ['png'] },
  svg: { name: 'SVG image', extensions: ['svg'] },
  pdf: { name: 'PDF document', extensions: ['pdf'] },
  xmi: { name: 'UML XMI', extensions: ['xmi'] }
}

/** An export larger than this is a bug, not a diagram. */
export const MAX_EXPORT_BYTES = 200 * 1024 * 1024

export interface SaveDialogOptions {
  title: string
  defaultPath: string
  filters: { name: string; extensions: string[] }[]
}

export interface SaveFileDeps {
  showSaveDialog: (options: SaveDialogOptions) => Promise<{ canceled: boolean; filePath?: string }>
  /** Where the dialog opens: the last export folder, or the documents folder. */
  lastDir: () => string
  rememberDir: (dir: string) => void | Promise<void>
  writeFile?: (path: string, data: Uint8Array | string) => Promise<void>
}

/** `<title>.<ext>`, without the characters no file system accepts. */
export function exportFileName(defaultName: string, extension: ExportExtension): string {
  const clean = basename(defaultName)
    // eslint-disable-next-line no-control-regex -- control characters are exactly what goes
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .trim()
    .replace(/^\.+/, '')
  return `${clean || 'diagram'}.${extension}`
}

export function assertExtension(value: unknown): asserts value is ExportExtension {
  if (!EXPORT_EXTENSIONS.includes(value as ExportExtension)) {
    throw new AppError('INVALID_ARGUMENT', 'Unknown export format')
  }
}

/**
 * Asks where to save (the native dialog, opened in the last export folder),
 * then writes the file. The path always comes from the dialog.
 */
export async function saveExportFile(
  defaultName: string,
  extension: ExportExtension,
  data: Uint8Array | string | (() => Promise<Uint8Array | string>),
  deps: SaveFileDeps
): Promise<ExportSaveResult> {
  if (typeof defaultName !== 'string') {
    throw new AppError('INVALID_ARGUMENT', 'The file name must be a string')
  }
  assertExtension(extension)
  const result = await deps.showSaveDialog({
    title: `Export as ${extension.toUpperCase()}`,
    defaultPath: join(deps.lastDir(), exportFileName(defaultName, extension)),
    filters: [FILTERS[extension]]
  })
  if (result.canceled || !result.filePath) return { canceled: true }

  // Produced only once there is a path: a cancelled PDF is never printed.
  const content = typeof data === 'function' ? await data() : data
  if (typeof content !== 'string' && !(content instanceof Uint8Array)) {
    throw new AppError('INVALID_ARGUMENT', 'Export data must be bytes or text')
  }
  const size = typeof content === 'string' ? Buffer.byteLength(content) : content.byteLength
  if (size > MAX_EXPORT_BYTES) throw new AppError('INVALID_ARGUMENT', 'The export is too large')

  const write = deps.writeFile ?? ((path, bytes) => fsp.writeFile(path, bytes))
  await write(result.filePath, content)
  await deps.rememberDir(dirname(result.filePath))
  return { path: result.filePath }
}
