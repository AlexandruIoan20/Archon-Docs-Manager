import { randomUUID } from 'crypto'
import { join } from 'path'
import type { CreateDiagramOptions, SoarDiagram } from '@/core/types'
import { DIAGRAM_FORMAT_VERSION, diagramFileSchema } from '@/core/schemas/diagram.schema'
import { FILE_EXTENSIONS } from '@/core/constants/file-extensions'
import { AppError } from '../errors'
import {
  entryRef,
  readAppFile,
  resolveFolder,
  writeAppFile,
  type EntryRefValue,
  type JsonFileOps
} from './file-helpers'
import { availableName, nextAvailableName, slugify } from './naming'
import { writeJsonAtomic } from './writer'

const DIAGRAM_OPS: JsonFileOps<typeof diagramFileSchema> = {
  ext: FILE_EXTENSIONS.diagram,
  schema: diagramFileSchema,
  label: 'diagram'
}

export interface CreatedDiagram extends EntryRefValue {
  diagram: SoarDiagram
}

/** `<type>-N.ardiag`, or a file named after `title`, with optional starter content. */
export async function createDiagram(
  root: string,
  folderRel: string,
  options: CreateDiagramOptions,
  now = new Date()
): Promise<CreatedDiagram> {
  const dir = await resolveFolder(root, folderRel)
  const cleanTitle = options.title?.trim()
  const timestamp = now.toISOString()

  const parsed = diagramFileSchema.safeParse({
    version: DIAGRAM_FORMAT_VERSION,
    id: randomUUID(),
    title: cleanTitle ?? '',
    type: options.type,
    engine: options.engine,
    created: timestamp,
    lastModified: timestamp,
    data: { nodes: options.nodes ?? [], edges: options.edges ?? [] },
    mermaidSource: options.mermaidSource ?? null
  })
  if (!parsed.success) {
    throw new AppError('INVALID_ARGUMENT', 'Invalid diagram options', parsed.error.issues)
  }

  const fileName = cleanTitle
    ? await availableName(dir, slugify(cleanTitle, parsed.data.type), FILE_EXTENSIONS.diagram)
    : await nextAvailableName(dir, parsed.data.type, FILE_EXTENSIONS.diagram)
  const diagram: SoarDiagram = {
    ...parsed.data,
    title: cleanTitle || fileName.slice(0, -FILE_EXTENSIONS.diagram.length)
  }
  const path = join(dir, fileName)
  await writeJsonAtomic(path, diagram)
  return { ...entryRef(root, path), diagram }
}

export function readDiagram(root: string, relPath: string): Promise<SoarDiagram> {
  return readAppFile(root, relPath, DIAGRAM_OPS)
}

export function writeDiagram(
  root: string,
  relPath: string,
  diagram: unknown,
  now?: Date
): Promise<SoarDiagram> {
  return writeAppFile(root, relPath, diagram, DIAGRAM_OPS, now)
}
