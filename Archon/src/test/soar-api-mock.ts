import { vi, type Mock } from 'vitest'
import type {
  AppInfo,
  AppSettings,
  IpcEvent,
  IpcEventPayload,
  ResolvedTheme,
  SoarApi
} from '@/core/types'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'

type Listener = (payload: unknown) => void
type Mocked<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? Mock<T[K]> : T[K] }

export interface SoarApiMockOptions extends Partial<AppInfo> {
  settings?: AppSettings
  systemTheme?: ResolvedTheme
}

export interface SoarApiMock {
  api: SoarApi & {
    app: Mocked<SoarApi['app']>
    window: Mocked<SoarApi['window']>
    settings: Mocked<SoarApi['settings']>
    system: Mocked<SoarApi['system']>
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
  const { settings = DEFAULT_SETTINGS, systemTheme = 'dark', ...info } = options
  const listeners = new Map<IpcEvent, Set<Listener>>()
  let stored = structuredClone(settings)

  const api: SoarApiMock['api'] = {
    app: {
      getInfo: resolved<AppInfo>({
        name: 'SOAR Docs Studio',
        version: '1.0.0',
        platform: 'linux',
        ...info
      })
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
