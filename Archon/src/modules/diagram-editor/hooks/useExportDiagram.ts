import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { EditorTabRef, ExportSaveResult, ArchonDiagram } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { titleFromPath, useEditorStore, useUiStore } from '@/store'
import { canvasToPng, canvasToSvg } from '../export/export-canvas'
import type { ExportFormat } from '../export/export-formats'
import type { ExportImage } from '../export/export-image'
import { mermaidToSvg, svgToPng } from '../export/export-mermaid'
import { serializeXmi } from '../export/xmi/serialize-xmi'
import type { DiagramState } from '../store/diagram.store'
import { getStore } from '../store/store-registry'
import { graphToFile } from '../utils/graph-mapping'
import { diagramQueryKey } from './useDiagram'

export interface ExportDiagram {
  run: (format: ExportFormat) => Promise<void>
  busy: boolean
}

/** Produces the file for `format` and hands it to main, which asks where to save it. */
async function produce(
  format: ExportFormat,
  state: DiagramState,
  tabId: string,
  defaultName: string
): Promise<ExportSaveResult> {
  const diagram = graphToFile(state)
  const { save, pdfFromSvg } = ipcClient.export
  if (format.id === 'xmi') {
    return save({ defaultName, extension: 'xmi', data: serializeXmi(diagram) })
  }
  const image = (): Promise<ExportImage> =>
    diagram.engine === 'mermaid'
      ? mermaidToSvg(diagram.mermaidSource ?? '')
      : canvasToSvg(tabId, state.nodes)
  switch (format.id) {
    case 'svg':
      return save({ defaultName, extension: 'svg', data: (await image()).svg })
    case 'pdf':
      return pdfFromSvg({ defaultName, ...(await image()) })
    case 'png': {
      const data =
        diagram.engine === 'mermaid'
          ? await svgToPng(await image())
          : await canvasToPng(tabId, state.nodes)
      return save({ defaultName, extension: 'png', data })
    }
  }
}

/**
 * Exports the tab's diagram: toasts at the start, on success and on error,
 * then records `exportedAt`. The viewport and the selection are left alone.
 */
export function useExportDiagram({ tabId, filePath }: EditorTabRef): ExportDiagram {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  /** Writes `exportedAt` at once when the tab is clean, so it does not turn dirty. */
  const recordExport = async (at: string): Promise<void> => {
    const store = getStore(tabId)
    if (!store) return
    const dirty = useEditorStore.getState().tabs.find((t) => t.id === tabId)?.dirty ?? false
    if (dirty) {
      // The pending autosave takes it along.
      store.getState().patchMeta({ exportedAt: at })
      return
    }
    const queryKey = diagramQueryKey(filePath)
    const next = graphToFile({
      ...store.getState(),
      meta: { ...store.getState().meta, exportedAt: at }
    })
    const saved = await ipcClient.fs.writeDiagram(filePath, next)
    store.getState().patchMeta({ exportedAt: saved.exportedAt }, { save: false })
    queryClient.setQueryData(queryKey, saved)
    store.getState().setBase(queryClient.getQueryData<ArchonDiagram>(queryKey) ?? saved)
  }

  const run = async (format: ExportFormat): Promise<void> => {
    const state = getStore(tabId)?.getState()
    if (!state || busy) return
    const { notify } = useUiStore.getState()
    const defaultName = state.meta.title || titleFromPath(filePath, 'ardiag')
    setBusy(true)
    notify(`Exporting ${defaultName}${format.extension} as ${format.label}`)
    try {
      const result = await produce(format, state, tabId, defaultName)
      if ('canceled' in result) {
        useUiStore.getState().dismissToast()
        return
      }
      notify(`Exported to ${result.path}`)
      await recordExport(new Date().toISOString()).catch((error: unknown) =>
        console.warn('[export] exportedAt was not saved', error)
      )
    } catch (error) {
      notify(`Export failed: ${(error as Error).message}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  return { run, busy }
}
