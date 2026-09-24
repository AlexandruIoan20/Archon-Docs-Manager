import type { IpcErrorCode, IpcErrorPayload } from '@/core/types'

/** An expected failure with a code the renderer can act on. */
export class AppError extends Error {
  constructor(
    readonly code: IpcErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

const FS_CODES: Record<string, IpcErrorCode> = {
  ENOENT: 'NOT_FOUND',
  EEXIST: 'ALREADY_EXISTS',
  ENOTEMPTY: 'ALREADY_EXISTS',
  EINVAL: 'INVALID_NAME'
}

/** Anything thrown by a handler, as a serializable payload. */
export function toErrorPayload(error: unknown): IpcErrorPayload {
  if (error instanceof AppError) {
    return error.details === undefined
      ? { code: error.code, message: error.message }
      : { code: error.code, message: error.message, details: error.details }
  }
  const errno = (error as NodeJS.ErrnoException | undefined)?.code
  const code = (errno && FS_CODES[errno]) || 'IO_ERROR'
  const message = error instanceof Error ? error.message : String(error)
  return { code, message }
}

/** True for a Node filesystem error with this errno code. */
export function isErrno(error: unknown, code: string): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === code
}
