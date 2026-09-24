/**
 * IPC error convention: handlers answer with a `Result` instead of throwing,
 * so the error code survives the process boundary. `ipcClient` unwraps it and
 * throws a typed `IpcError` for React Query.
 */

export type IpcErrorCode =
  | 'NO_WORKSPACE'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_FILE'
  | 'INVALID_NAME'
  | 'INVALID_MOVE'
  | 'INVALID_ARGUMENT'
  | 'PATH_OUTSIDE_WORKSPACE'
  | 'IO_ERROR'

export interface IpcErrorPayload {
  code: IpcErrorCode
  message: string
  /** Structured context, e.g. validation issues for `INVALID_FILE`. */
  details?: unknown
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: IpcErrorPayload }

/** The success value carried by a `Result`. */
export type ResultValue<R> = R extends Result<infer T> ? T : never
