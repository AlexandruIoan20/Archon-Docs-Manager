/**
 * Single source of truth for every IPC channel between main and renderer.
 * Main registers handlers against this map, preload invokes against it and the
 * renderer consumes the resulting `SoarApi` — a mismatch fails at compile time.
 */

import type { CreateDiagramOptions, SoarDiagram } from './diagram.types'
import type { ExportPdfRequest, ExportSaveRequest, ExportSaveResult } from './export.types'
import type { SoarDocument } from './document.types'
import type { Result } from './result.types'
import type { IndexProgress, IndexStatus, SearchResult, TagCount } from './search.types'
import type { AppSettings, ResolvedTheme, SettingsPatch } from './settings.types'
import type { FolderEntry, WorkspaceInfo, WorkspaceSettings } from './workspace.types'

/** Where a created, renamed or moved entry now lives. */
export interface EntryRef {
  relPath: string
  name: string
}

export type AppPlatform = 'darwin' | 'win32' | 'linux'

export interface AppInfo {
  name: string
  version: string
  platform: AppPlatform
}

/** Colors of the native window controls drawn by the OS (Windows overlay). */
export interface TitleBarColors {
  /** Background, `#RRGGBB`. */
  color: string
  /** Glyph color, `#RRGGBB`. */
  symbolColor: string
}

/** Renderer → main request/response channels (`ipcRenderer.invoke`). */
export interface IpcInvokeContract {
  'app:get-info': { args: []; result: AppInfo }
  /** The page's close guard is running: main now waits for it before closing. */
  'app:enable-close-guard': { args: []; result: void }
  /** The renderer agreed to let the window close (answer to `app:before-quit`). */
  'app:confirm-close': { args: []; result: void }
  'window:minimize': { args: []; result: void }
  'window:toggle-maximize': { args: []; result: void }
  'window:close': { args: []; result: void }
  'window:is-maximized': { args: []; result: boolean }
  'window:set-titlebar-colors': { args: [colors: TitleBarColors]; result: void }
  /** Interface zoom factor, 0.8–1.5. */
  'window:set-zoom': { args: [factor: number]; result: void }
  'settings:get': { args: []; result: AppSettings }
  /** Partial update; main validates it and answers with the stored settings. */
  'settings:update': { args: [patch: SettingsPatch]; result: AppSettings }
  'system:get-theme': { args: []; result: ResolvedTheme }

  // Channels from plan 07 on answer with `Result<T>`.
  /** Asks for a folder, then creates `workspace.arws` in it; `null` if cancelled. */
  'workspace:create': { args: [name: string]; result: Result<WorkspaceInfo | null> }
  /** `null` if the dialog was cancelled. */
  'workspace:open-dialog': { args: []; result: Result<WorkspaceInfo | null> }
  /** Absolute root path from the recent list. */
  'workspace:open-recent': { args: [rootPath: string]; result: Result<WorkspaceInfo> }
  'workspace:close': { args: []; result: Result<null> }
  'workspace:get-current': { args: []; result: Result<WorkspaceInfo | null> }
  'workspace:update-settings': {
    args: [patch: Partial<WorkspaceSettings>]
    result: Result<WorkspaceInfo>
  }
  /** The whole tree; the root entry has `relPath: ''`. */
  'workspace:read-tree': { args: []; result: Result<FolderEntry> }
  'workspace:reveal': { args: [relPath: string]; result: Result<null> }

  // Files (plan 09). Paths are workspace-relative.
  'fs:create-document': { args: [folderRel: string, title?: string]; result: Result<EntryRef> }
  'fs:create-diagram': {
    args: [folderRel: string, options: CreateDiagramOptions]
    result: Result<EntryRef>
  }
  /** `new-folder-N` when no name is given. */
  'fs:create-folder': { args: [parentRel: string, name?: string]; result: Result<EntryRef> }
  'fs:read-document': { args: [relPath: string]; result: Result<SoarDocument> }
  'fs:write-document': {
    args: [relPath: string, document: SoarDocument]
    result: Result<SoarDocument>
  }
  'fs:read-diagram': { args: [relPath: string]; result: Result<SoarDiagram> }
  'fs:write-diagram': { args: [relPath: string, diagram: SoarDiagram]; result: Result<SoarDiagram> }
  /** Files keep their extension; `newName` is the name shown in the tree. */
  'fs:rename': { args: [relPath: string, newName: string]; result: Result<EntryRef> }
  'fs:move': { args: [relPath: string, targetFolderRel: string]; result: Result<EntryRef> }
  /** Moves the entry to the system trash. */
  'fs:delete': { args: [relPath: string]; result: Result<null> }

  // Index & search (plan 10).
  'index:get-status': { args: []; result: Result<IndexStatus> }
  /** Deletes the workspace index and builds it again; answers when done. */
  'index:rebuild': { args: []; result: Result<IndexStatus> }
  /** Every tag in the workspace (files and nodes), most used first. */
  'index:list-tags': { args: []; result: Result<TagCount[]> }
  /** Full-text search; `limit` defaults to `SEARCH_DEFAULT_LIMIT`. */
  'search:query': { args: [text: string, limit?: number]; result: Result<SearchResult[]> }

  // Export (plan 19). Main asks where to save; the renderer only sends the content.
  'export:save': { args: [request: ExportSaveRequest]; result: Result<ExportSaveResult> }
  /** Prints the SVG to a one-page PDF in a hidden window, then saves it. */
  'export:pdf-from-svg': { args: [request: ExportPdfRequest]; result: Result<ExportSaveResult> }
}

export type IpcChannel = keyof IpcInvokeContract
export type IpcArgs<C extends IpcChannel> = IpcInvokeContract[C]['args']
export type IpcResult<C extends IpcChannel> = IpcInvokeContract[C]['result']

/** Main → renderer push events (`webContents.send`), keyed by event name. */
export interface IpcEventContract {
  'window:maximized-changed': boolean
  /** The OS switched between dark and light. */
  'system:theme-changed': ResolvedTheme
  /** Files changed on disk (debounced); the tree must be read again. */
  'workspace:tree-changed': null
  /**
   * The window is about to close (or the app to quit). The renderer saves or
   * asks about unsaved changes, then answers with `app:confirm-close`.
   */
  'app:before-quit': null
  /** Full sync progress; `idle` once it is done. */
  'index:progress': IndexProgress
}

export type IpcEvent = keyof IpcEventContract
export type IpcEventPayload<E extends IpcEvent> = IpcEventContract[E]
export type IpcUnsubscribe = () => void
