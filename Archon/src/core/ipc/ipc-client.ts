import type {
  AppInfo,
  AppSettings,
  CreateDiagramOptions,
  EntryRef,
  ExportPdfRequest,
  ExportSaveRequest,
  ExportSaveResult,
  FolderEntry,
  IndexStatus,
  IpcEvent,
  IpcEventPayload,
  IpcUnsubscribe,
  ResolvedTheme,
  SearchResult,
  SettingsPatch,
  SoarApi,
  SoarDiagram,
  SoarDocument,
  TagCount,
  TitleBarColors,
  WorkspaceInfo,
  WorkspaceSettings
} from '@/core/types'
import { unwrap } from './ipc-error'

/**
 * The only renderer-side entry point to the main process. Modules call this client,
 * never `window.soar` directly, so the bridge can be mocked or swapped in one place.
 */
function bridge(): SoarApi {
  if (!window.soar) {
    throw new Error('IPC bridge unavailable: preload script did not expose window.soar')
  }
  return window.soar
}

/**
 * Runs a bridge call; a missing bridge becomes a rejected promise, never a sync throw.
 * Channels answering with `Result<T>` are unwrapped with `unwrap`, so failures
 * reach callers as a typed `IpcError`.
 */
function call<T>(run: (api: SoarApi) => Promise<T>): Promise<T> {
  try {
    return run(bridge())
  } catch (error) {
    return Promise.reject(error)
  }
}

export const ipcClient = {
  /** False in unit tests or if the preload script failed to load. */
  isAvailable: (): boolean => window.soar !== undefined,
  app: {
    getInfo: (): Promise<AppInfo> => call((api) => api.app.getInfo()),
    enableCloseGuard: (): Promise<void> => call((api) => api.app.enableCloseGuard()),
    confirmClose: (): Promise<void> => call((api) => api.app.confirmClose())
  },
  window: {
    minimize: (): Promise<void> => call((api) => api.window.minimize()),
    toggleMaximize: (): Promise<void> => call((api) => api.window.toggleMaximize()),
    close: (): Promise<void> => call((api) => api.window.close()),
    isMaximized: (): Promise<boolean> => call((api) => api.window.isMaximized()),
    setTitleBarColors: (colors: TitleBarColors): Promise<void> =>
      call((api) => api.window.setTitleBarColors(colors)),
    setZoom: (factor: number): Promise<void> => call((api) => api.window.setZoom(factor))
  },
  settings: {
    get: (): Promise<AppSettings> => call((api) => api.settings.get()),
    update: (patch: SettingsPatch): Promise<AppSettings> =>
      call((api) => api.settings.update(patch))
  },
  system: {
    getTheme: (): Promise<ResolvedTheme> => call((api) => api.system.getTheme())
  },
  workspace: {
    /** `null` when the folder dialog was cancelled. */
    create: (name: string): Promise<WorkspaceInfo | null> =>
      unwrap(call((api) => api.workspace.create(name))),
    /** `null` when the dialog was cancelled. */
    openDialog: (): Promise<WorkspaceInfo | null> =>
      unwrap(call((api) => api.workspace.openDialog())),
    openRecent: (rootPath: string): Promise<WorkspaceInfo> =>
      unwrap(call((api) => api.workspace.openRecent(rootPath))),
    close: (): Promise<null> => unwrap(call((api) => api.workspace.close())),
    getCurrent: (): Promise<WorkspaceInfo | null> =>
      unwrap(call((api) => api.workspace.getCurrent())),
    updateSettings: (patch: Partial<WorkspaceSettings>): Promise<WorkspaceInfo> =>
      unwrap(call((api) => api.workspace.updateSettings(patch))),
    readTree: (): Promise<FolderEntry> => unwrap(call((api) => api.workspace.readTree())),
    reveal: (relPath: string): Promise<null> => unwrap(call((api) => api.workspace.reveal(relPath)))
  },
  fs: {
    createDocument: (folderRel: string, title?: string): Promise<EntryRef> =>
      unwrap(call((api) => api.fs.createDocument(folderRel, title))),
    createDiagram: (folderRel: string, options: CreateDiagramOptions): Promise<EntryRef> =>
      unwrap(call((api) => api.fs.createDiagram(folderRel, options))),
    createFolder: (parentRel: string, name?: string): Promise<EntryRef> =>
      unwrap(call((api) => api.fs.createFolder(parentRel, name))),
    readDocument: (relPath: string): Promise<SoarDocument> =>
      unwrap(call((api) => api.fs.readDocument(relPath))),
    writeDocument: (relPath: string, document: SoarDocument): Promise<SoarDocument> =>
      unwrap(call((api) => api.fs.writeDocument(relPath, document))),
    readDiagram: (relPath: string): Promise<SoarDiagram> =>
      unwrap(call((api) => api.fs.readDiagram(relPath))),
    writeDiagram: (relPath: string, diagram: SoarDiagram): Promise<SoarDiagram> =>
      unwrap(call((api) => api.fs.writeDiagram(relPath, diagram))),
    rename: (relPath: string, newName: string): Promise<EntryRef> =>
      unwrap(call((api) => api.fs.rename(relPath, newName))),
    move: (relPath: string, targetFolderRel: string): Promise<EntryRef> =>
      unwrap(call((api) => api.fs.move(relPath, targetFolderRel))),
    delete: (relPath: string): Promise<null> => unwrap(call((api) => api.fs.delete(relPath)))
  },
  index: {
    getStatus: (): Promise<IndexStatus> => unwrap(call((api) => api.index.getStatus())),
    rebuild: (): Promise<IndexStatus> => unwrap(call((api) => api.index.rebuild())),
    listTags: (): Promise<TagCount[]> => unwrap(call((api) => api.index.listTags()))
  },
  search: {
    query: (text: string, limit?: number): Promise<SearchResult[]> =>
      unwrap(call((api) => api.search.query(text, limit)))
  },
  export: {
    save: (request: ExportSaveRequest): Promise<ExportSaveResult> =>
      unwrap(call((api) => api.export.save(request))),
    pdfFromSvg: (request: ExportPdfRequest): Promise<ExportSaveResult> =>
      unwrap(call((api) => api.export.pdfFromSvg(request)))
  },
  /** Throws if the bridge is missing; check `isAvailable()` first where that is expected. */
  on: <E extends IpcEvent>(
    event: E,
    callback: (payload: IpcEventPayload<E>) => void
  ): IpcUnsubscribe => bridge().on(event, callback)
}
