import { BrowserWindow, dialog, shell, type OpenDialogOptions } from 'electron'
import { isAbsolute } from 'path'
import type { WorkspaceInfo } from '@/core/types'
import { AppError } from '../errors'
import { resolveInWorkspace } from '../file-system/paths'
import { readTree } from '../file-system/reader'
import {
  closeWorkspace,
  createWorkspace,
  getCurrent,
  openWorkspace,
  requireCurrent,
  toInfo,
  updateWorkspaceSettings,
  type OpenWorkspace
} from '../file-system/workspace'
import { getSettingsStore } from '../settings'
import {
  forgetLastWorkspace,
  rememberWorkspace,
  removeRecentWorkspace
} from '../settings/recent-workspaces'
import { handleResult } from './typed-ipc'

async function showOpenDialog(
  sender: Electron.WebContents,
  options: OpenDialogOptions
): Promise<string | null> {
  const window = BrowserWindow.fromWebContents(sender)
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  return result.canceled ? null : (result.filePaths[0] ?? null)
}

async function opened(workspace: OpenWorkspace): Promise<WorkspaceInfo> {
  await rememberWorkspace(getSettingsStore(), workspace.root)
  return toInfo(workspace)
}

// Windows and Linux cannot pick files and folders in the same dialog.
const OPEN_PROPERTIES: OpenDialogOptions['properties'] =
  process.platform === 'darwin' ? ['openFile', 'openDirectory'] : ['openFile']

export function registerWorkspaceHandlers(): void {
  handleResult('workspace:create', async (event, name) => {
    if (typeof name !== 'string') throw new AppError('INVALID_ARGUMENT', 'Name must be a string')
    const dir = await showOpenDialog(event.sender, {
      title: 'Choose a folder for the workspace',
      buttonLabel: 'Create workspace',
      properties: ['openDirectory', 'createDirectory']
    })
    return dir ? opened(await createWorkspace(dir, name)) : null
  })

  handleResult('workspace:open-dialog', async (event) => {
    const path = await showOpenDialog(event.sender, {
      title: 'Open workspace',
      buttonLabel: 'Open',
      properties: OPEN_PROPERTIES,
      filters: [{ name: 'Archon workspace', extensions: ['arws'] }]
    })
    return path ? opened(await openWorkspace(path)) : null
  })

  handleResult('workspace:open-recent', async (_event, rootPath) => {
    if (typeof rootPath !== 'string' || !isAbsolute(rootPath)) {
      throw new AppError('INVALID_ARGUMENT', 'Expected an absolute workspace path')
    }
    try {
      return await opened(await openWorkspace(rootPath))
    } catch (error) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') {
        await removeRecentWorkspace(getSettingsStore(), rootPath)
      }
      throw error
    }
  })

  handleResult('workspace:close', async () => {
    await closeWorkspace()
    await forgetLastWorkspace(getSettingsStore())
    return null
  })

  handleResult('workspace:get-current', () => {
    const current = getCurrent()
    return current ? toInfo(current) : null
  })

  handleResult('workspace:update-settings', async (_event, patch) => {
    if (typeof patch !== 'object' || patch === null) {
      throw new AppError('INVALID_ARGUMENT', 'Expected a settings object')
    }
    return toInfo(await updateWorkspaceSettings(patch))
  })

  handleResult('workspace:read-tree', () => readTree(requireCurrent().root))

  handleResult('workspace:reveal', async (_event, relPath) => {
    shell.showItemInFolder(await resolveInWorkspace(requireCurrent().root, relPath))
    return null
  })
}
