import type { TreeEntry } from '@/core/types'

/** Paths of every file in the tree. */
export function collectFilePaths(entry: TreeEntry, out = new Set<string>()): Set<string> {
  if (entry.kind === 'folder') {
    for (const child of entry.children) collectFilePaths(child, out)
  } else {
    out.add(entry.relPath)
  }
  return out
}
