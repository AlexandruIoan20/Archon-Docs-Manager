import { vi, type Mock } from 'vitest'
import type {
  AppInfo,
  AppSettings,
  IndexStatus,
  IpcEvent,
  IpcEventPayload,
  ResolvedTheme,
  SoarApi
} from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { createFsApiMock } from './fs-api-mock'
import {
  createWorkspaceApiMock,
  ok,
  type MockedSection as Mocked,
  type WorkspaceMockOptions
} from './workspace-api-mock'

type Listener = (payload: unknown) => void

export interface SoarApiMockOptions extends Partial<AppInfo>, WorkspaceMockOptions {
  settings?: AppSettings
  systemTheme?: ResolvedTheme
  indexStatus?: IndexStatus
}

export interface SoarApiMock {
  api: SoarApi & {
    app: Mocked<SoarApi['app']>
    window: Mocked<SoarApi['window']>
    settings: Mocked<SoarApi['settings']>
    system: Mocked<SoarApi['system']>
    workspace: Mocked<SoarApi['workspace']>
    fs: Mocked<SoarApi['fs']>
    index: Mocked<SoarApi['index']>
    search: Mocked<SoarApi['search']>
    export: Mocked<SoarApi['export']>
  }
  /** Simulates a main → renderer event reaching every current subscriber. */
  emit: <E extends IpcEvent>(event: E, payload: IpcEventPayload<E>) => void
  listenerCount: (event: IpcEvent) => number
  /** Settings as the fake main process currently stores them. */
  storedSettings: () => AppSettings
}

const resolved = <T>(value: T): Mock<() => Promise<T>> =>
  vi.fn<() => Promise<T>>(() => Promise.resolve(value))

/** A complete fake `window.soar`. Install it with `window.soar = mock.api`. */
export function createSoarApiMock(options: SoarApiMockOptions = {}): SoarApiMock {
  const {
    settings = DEFAULT_SETTINGS,
    systemTheme = 'dark',
    indexStatus = { indexing: false, files: 0, skipped: 0, lastSync: null },
    workspace,
    tree,
    ...info
  } = options
  const listeners = new Map<IpcEvent, Set<Listener>>()
  let stored = structuredClone(settings)

  const api: SoarApiMock['api'] = {
    app: {
      getInfo: resolved<AppInfo>({
        name: 'SOAR Docs Studio',
        version: '1.0.0',
        platform: 'linux',
        ...info
      }),
      enableCloseGuard: resolved(undefined),
      confirmClose: resolved(undefined)
    },
    window: {
      minimize: resolved(undefined),
      toggleMaximize: resolved(undefined),
      close: resolved(undefined),
      isMaximized: resolved(false),
      setTitleBarColors: resolved(undefined),
      setZoom: resolved(undefined)
    },
    settings: {
      get: vi.fn(() => Promise.resolve(structuredClone(stored))),
      update: vi.fn<SoarApi['settings']['update']>((patch) => {
        stored = mergeSettings(stored, patch)
        return Promise.resolve(structuredClone(stored))
      })
    },
    system: {
      getTheme: resolved(systemTheme)
    },
    workspace: createWorkspaceApiMock({ workspace, tree }),
    fs: createFsApiMock(),
    index: {
      getStatus: vi.fn(() => Promise.resolve(ok(indexStatus))),
      rebuild: vi.fn(() => Promise.resolve(ok(indexStatus))),
      listTags: vi.fn(() => Promise.resolve(ok([])))
    },
    search: {
      query: vi.fn(() => Promise.resolve(ok([])))
    },
    export: {
      save: vi.fn(() => Promise.resolve(ok({ canceled: true as const }))),
      pdfFromSvg: vi.fn(() => Promise.resolve(ok({ canceled: true as const })))
    },
    on: (event, callback) => {
      const set = listeners.get(event) ?? new Set<Listener>()
      const listener = callback as Listener
      set.add(listener)
      listeners.set(event, set)
      return () => {
        set.delete(listener)
      }
    }
  }

  return {
    api,
    emit: (event, payload) => listeners.get(event)?.forEach((listener) => listener(payload)),
    listenerCount: (event) => listeners.get(event)?.size ?? 0,
    storedSettings: () => stored
  }
}
