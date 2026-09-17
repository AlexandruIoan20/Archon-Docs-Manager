import { vi, type Mock } from 'vitest'
import type { AppInfo, IpcEvent, IpcEventPayload, SoarApi } from '@/core/types'

type Listener = (payload: unknown) => void

export interface SoarApiMock {
  api: SoarApi & {
    app: { getInfo: Mock<SoarApi['app']['getInfo']> }
    window: { [K in keyof SoarApi['window']]: Mock<SoarApi['window'][K]> }
  }
  /** Simulates a main → renderer event reaching every current subscriber. */
  emit: <E extends IpcEvent>(event: E, payload: IpcEventPayload<E>) => void
  listenerCount: (event: IpcEvent) => number
}

/** A complete fake `window.soar`. Install it with `window.soar = mock.api`. */
export function createSoarApiMock(info: Partial<AppInfo> = {}): SoarApiMock {
  const listeners = new Map<IpcEvent, Set<Listener>>()

  const api: SoarApiMock['api'] = {
    app: {
      getInfo: vi.fn<SoarApi['app']['getInfo']>().mockResolvedValue({
        name: 'SOAR Docs Studio',
        version: '1.0.0',
        platform: 'linux',
        ...info
      })
    },
    window: {
      minimize: vi.fn<SoarApi['window']['minimize']>().mockResolvedValue(undefined),
      toggleMaximize: vi.fn<SoarApi['window']['toggleMaximize']>().mockResolvedValue(undefined),
      close: vi.fn<SoarApi['window']['close']>().mockResolvedValue(undefined),
      isMaximized: vi.fn<SoarApi['window']['isMaximized']>().mockResolvedValue(false),
      setTitleBarColors: vi
        .fn<SoarApi['window']['setTitleBarColors']>()
        .mockResolvedValue(undefined)
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
    listenerCount: (event) => listeners.get(event)?.size ?? 0
  }
}
