import { describe, expect, it } from 'vitest'
import type { FolderEntry } from '@/core/types'
import { folderPaths } from '../folder-paths'

const folder = (relPath: string, children: FolderEntry['children'] = []): FolderEntry => ({
  kind: 'folder',
  name: relPath.split('/').at(-1) ?? '',
  relPath,
  children
})

describe('folderPaths', () => {
  it('lists the root, then the folders depth first', () => {
    const tree = folder('', [folder('A', [folder('A/B')]), folder('C')])
    expect(folderPaths(tree)).toEqual(['', 'A', 'A/B', 'C'])
  })
})
