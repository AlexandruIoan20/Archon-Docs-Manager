import { app, BrowserWindow, dialog, type IpcMainInvokeEvent } from 'electron'
import type { ExportExtension } from '@/core/types'
import { AppError } from '../errors'
import { saveExportFile, type SaveFileDeps } from '../export/save-file'
import { svgToPdf } from '../export/svg-to-pdf'
import { getSettingsStore } from '../settings'
import { handleResult } from './typed-ipc'

function saveDeps(event: IpcMainInvokeEvent): SaveFileDeps {
  const window = BrowserWindow.fromWebContents(event.sender)
  const settings = getSettingsStore()
  return {
    showSaveDialog: (options) =>
      window ? dialog.showSaveDialog(window, options) : dialog.showSaveDialog(options),
    lastDir: () => settings.get().session.lastExportDir ?? app.getPath('documents'),
    rememberDir: async (dir) => {
      await settings.update({ session: { lastExportDir: dir } })
    }
  }
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new AppError('INVALID_ARGUMENT', 'Export request is required')
  }
  return value as Record<string, unknown>
}

/** Saving exported diagrams (plan 19). */
export function registerExportHandlers(): void {
  handleResult('export:save', (event, request) => {
    const { defaultName, extension, data } = asObject(request)
    if (extension === 'pdf')
      throw new AppError('INVALID_ARGUMENT', 'PDF goes through export:pdf-from-svg')
    return saveExportFile(
      defaultName as string,
      extension as ExportExtension,
      data as Uint8Array | string,
      saveDeps(event)
    )
  })

  handleResult('export:pdf-from-svg', (event, request) => {
    const { defaultName, svg, width, height } = asObject(request)
    return saveExportFile(
      defaultName as string,
      'pdf',
      () => svgToPdf(svg as string, width as number, height as number),
      saveDeps(event)
    )
  })
}
