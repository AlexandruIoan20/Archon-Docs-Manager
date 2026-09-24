import type { IpcErrorCode, IpcErrorPayload, Result } from '@/core/types'

/** A failure reported by a main-process handler, with its code preserved. */
export class IpcError extends Error {
  readonly code: IpcErrorCode
  readonly details: unknown

  constructor({ code, message, details }: IpcErrorPayload) {
    super(message)
    this.name = 'IpcError'
    this.code = code
    this.details = details
  }
}

export function isIpcError(error: unknown, code?: IpcErrorCode): error is IpcError {
  return error instanceof IpcError && (code === undefined || error.code === code)
}

/** Resolves with the value or rejects with an `IpcError`. */
export async function unwrap<T>(pending: Promise<Result<T>>): Promise<T> {
  const result = await pending
  if (result.ok) return result.value
  throw new IpcError(result.error)
}
