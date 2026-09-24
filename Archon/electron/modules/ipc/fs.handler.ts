import { shell } from 'electron'
import type { EntryRef } from '@/core/types'
import { AppError } from '../errors'
import { createDiagram, readDiagram, writeDiagram } from '../file-system/diagrams'
import { createDocument, readDocument, writeDocument } from '../file-system/documents'
import { createFolder, deleteEntry, moveEntry, renameEntry } from '../file-system/entries'
import { requireCurrent } from '../file-system/workspace'
import { reindexPaths } from '../index-service'
import { handleResult } from './typed-ipc'

const root = (): string => requireCurrent().root

function assertString(value: unknown, what: string): asserts value is string {
  if (typeof value !== 'string') throw new AppError('INVALID_ARGUMENT', `${what} must be a string`)
}

function optionalString(value: unknown, what: string): string | undefined {
  if (value === undefined || value === null) return undefined
  assertString(value, what)
  return value
}

const toRef = ({ relPath, name }: EntryRef): EntryRef => ({ relPath, name })

/** The watcher skips the app's own writes, so the index is updated here. */
function indexed(ref: EntryRef, ...alsoChanged: string[]): EntryRef {
  reindexPaths(...alsoChanged, ref.relPath)
  return toRef(ref)
}

/** File operations for the open workspace. Every path is checked by `resolveInWorkspace`. */
export function registerFsHandlers(): void {
  handleResult('fs:create-document', async (_event, folderRel, title) => {
    assertString(folderRel, 'Folder')
    return indexed(await createDocument(root(), folderRel, optionalString(title, 'Title')))
  })

  handleResult('fs:create-diagram', async (_event, folderRel, options) => {
    assertString(folderRel, 'Folder')
    if (typeof options !== 'object' || options === null) {
      throw new AppError('INVALID_ARGUMENT', 'Diagram options are required')
    }
    return indexed(await createDiagram(root(), folderRel, options))
  })

  handleResult('fs:create-folder', (_event, parentRel, name) => {
    assertString(parentRel, 'Folder')
    return createFolder(root(), parentRel, optionalString(name, 'Name'))
  })

  handleResult('fs:read-document', (_event, relPath) => readDocument(root(), relPath))
  handleResult('fs:write-document', async (_event, relPath, document) => {
    const saved = await writeDocument(root(), relPath, document)
    reindexPaths(relPath)
    return saved
  })
  handleResult('fs:read-diagram', (_event, relPath) => readDiagram(root(), relPath))
  handleResult('fs:write-diagram', async (_event, relPath, diagram) => {
    const saved = await writeDiagram(root(), relPath, diagram)
    reindexPaths(relPath)
    return saved
  })

  handleResult('fs:rename', async (_event, relPath, newName) => {
    assertString(relPath, 'Path')
    assertString(newName, 'Name')
    return indexed(await renameEntry(root(), relPath, newName), relPath)
  })

  handleResult('fs:move', async (_event, relPath, targetFolderRel) => {
    assertString(relPath, 'Path')
    assertString(targetFolderRel, 'Target folder')
    return indexed(await moveEntry(root(), relPath, targetFolderRel), relPath)
  })

  handleResult('fs:delete', async (_event, relPath) => {
    assertString(relPath, 'Path')
    await deleteEntry(root(), relPath, (path) => shell.trashItem(path))
    reindexPaths(relPath)
    return null
  })
}
