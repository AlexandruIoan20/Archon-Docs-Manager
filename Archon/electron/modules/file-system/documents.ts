import { randomUUID } from 'crypto'
import { join } from 'path'
import type { ArchonDocument } from '@/core/types'
import { DOCUMENT_FORMAT_VERSION, documentFileSchema } from '@/core/schemas/document.schema'
import { FILE_EXTENSIONS } from '@/core/constants/file-extensions'
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

const DOCUMENT_OPS: JsonFileOps<typeof documentFileSchema> = {
  ext: FILE_EXTENSIONS.document,
  schema: documentFileSchema,
  label: 'document'
}

export interface CreatedDocument extends EntryRefValue {
  document: ArchonDocument
}

/** `untitled-N.ardoc`, or a file named after `title`, in an existing folder. */
export async function createDocument(
  root: string,
  folderRel: string,
  title?: string,
  now = new Date()
): Promise<CreatedDocument> {
  const dir = await resolveFolder(root, folderRel)
  const cleanTitle = title?.trim()
  const fileName = cleanTitle
    ? await availableName(dir, slugify(cleanTitle), FILE_EXTENSIONS.document)
    : await nextAvailableName(dir, 'untitled', FILE_EXTENSIONS.document)
  const timestamp = now.toISOString()

  const document = documentFileSchema.parse({
    version: DOCUMENT_FORMAT_VERSION,
    id: randomUUID(),
    title: cleanTitle || fileName.slice(0, -FILE_EXTENSIONS.document.length),
    created: timestamp,
    lastModified: timestamp
  })
  const path = join(dir, fileName)
  await writeJsonAtomic(path, document)
  return { ...entryRef(root, path), document }
}

export function readDocument(root: string, relPath: string): Promise<ArchonDocument> {
  return readAppFile(root, relPath, DOCUMENT_OPS)
}

export function writeDocument(
  root: string,
  relPath: string,
  document: unknown,
  now?: Date
): Promise<ArchonDocument> {
  return writeAppFile(root, relPath, document, DOCUMENT_OPS, now)
}
