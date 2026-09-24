/** True if `path` is `prefix` itself or lives inside it. */
export function isSameOrInside(path: string, prefix: string): boolean {
  return prefix === '' || path === prefix || path.startsWith(`${prefix}/`)
}

/** `path` after `from` was renamed or moved to `to`; unrelated paths are unchanged. */
export function remapPath(path: string, from: string, to: string): string {
  if (path === from) return to
  return path.startsWith(`${from}/`) ? `${to}${path.slice(from.length)}` : path
}

export function parentPath(relPath: string): string {
  const index = relPath.lastIndexOf('/')
  return index === -1 ? '' : relPath.slice(0, index)
}

export function baseName(relPath: string): string {
  return relPath.slice(relPath.lastIndexOf('/') + 1)
}
