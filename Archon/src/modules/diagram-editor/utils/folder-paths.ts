import type { FolderEntry } from '@/core/types'

/** Every folder of the tree, depth first; `''` (the root) first. */
export function folderPaths(tree: FolderEntry): string[] {
  const paths: string[] = [tree.relPath]
  for (const child of tree.children) {
    if (child.kind === 'folder') paths.push(...folderPaths(child))
  }
  return paths
}
