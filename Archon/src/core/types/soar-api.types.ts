import type { CreateDiagramOptions, SoarDiagram } from './diagram.types'
import type { SoarDocument } from './document.types'
import type {
  AppInfo,
  EntryRef,
  IpcEvent,
  IpcEventPayload,
  IpcUnsubscribe,
  TitleBarColors
} from './ipc.types'
import type { Result } from './result.types'
import type { IndexStatus, SearchResult, TagCount } from './search.types'
import type { AppSettings, ResolvedTheme, SettingsPatch } from './settings.types'
import type { FolderEntry, WorkspaceInfo, WorkspaceSettings } from './workspace.types'

/** API surface exposed on `window.soar` by the preload script. */
export interface SoarApi {
  app: {
    getInfo: () => Promise<AppInfo>
    confirmClose: () => Promise<void>
  }
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    setTitleBarColors: (colors: TitleBarColors) => Promise<void>
    setZoom: (factor: number) => Promise<void>
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (patch: SettingsPatch) => Promise<AppSettings>
  }
  system: {
    getTheme: () => Promise<ResolvedTheme>
  }
  workspace: {
    create: (name: string) => Promise<Result<WorkspaceInfo | null>>
    openDialog: () => Promise<Result<WorkspaceInfo | null>>
    openRecent: (rootPath: string) => Promise<Result<WorkspaceInfo>>
    close: () => Promise<Result<null>>
    getCurrent: () => Promise<Result<WorkspaceInfo | null>>
    updateSettings: (patch: Partial<WorkspaceSettings>) => Promise<Result<WorkspaceInfo>>
    readTree: () => Promise<Result<FolderEntry>>
    reveal: (relPath: string) => Promise<Result<null>>
  }
  fs: {
    createDocument: (folderRel: string, title?: string) => Promise<Result<EntryRef>>
    createDiagram: (folderRel: string, options: CreateDiagramOptions) => Promise<Result<EntryRef>>
    createFolder: (parentRel: string, name?: string) => Promise<Result<EntryRef>>
    readDocument: (relPath: string) => Promise<Result<SoarDocument>>
    writeDocument: (relPath: string, document: SoarDocument) => Promise<Result<SoarDocument>>
    readDiagram: (relPath: string) => Promise<Result<SoarDiagram>>
    writeDiagram: (relPath: string, diagram: SoarDiagram) => Promise<Result<SoarDiagram>>
    rename: (relPath: string, newName: string) => Promise<Result<EntryRef>>
    move: (relPath: string, targetFolderRel: string) => Promise<Result<EntryRef>>
    delete: (relPath: string) => Promise<Result<null>>
  }
  index: {
    getStatus: () => Promise<Result<IndexStatus>>
    rebuild: () => Promise<Result<IndexStatus>>
    listTags: () => Promise<Result<TagCount[]>>
  }
  search: {
    query: (text: string, limit?: number) => Promise<Result<SearchResult[]>>
  }
  /** Subscribes to a main-process event; returns the unsubscribe function. */
  on: <E extends IpcEvent>(
    event: E,
    callback: (payload: IpcEventPayload<E>) => void
  ) => IpcUnsubscribe
}
