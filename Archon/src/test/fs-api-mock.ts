import { vi } from 'vitest'
import type { EntryRef, ArchonApi } from '@/core/types'
import { ok, type MockedSection } from './workspace-api-mock'

const ref = (relPath: string): EntryRef => ({
  relPath,
  name: relPath.split('/').pop() ?? relPath
})
const join = (folder: string, name: string): string => (folder ? `${folder}/${name}` : name)
const parent = (relPath: string): string => relPath.split('/').slice(0, -1).join('/')

/**
 * Fake `window.archon.fs`. Creation returns predictable names (`untitled-1`,
 * `new-folder-1`, `flowchart-1`); tests override single calls when needed.
 */
export function createFsApiMock(): MockedSection<ArchonApi['fs']> {
  return {
    createDocument: vi.fn((folder: string) =>
      Promise.resolve(ok(ref(join(folder, 'untitled-1.ardoc'))))
    ),
    createDiagram: vi.fn((folder: string, options) =>
      Promise.resolve(ok(ref(join(folder, `${options.type}-1.ardiag`))))
    ),
    createFolder: vi.fn((folder: string, name?: string) =>
      Promise.resolve(ok(ref(join(folder, name ?? 'new-folder-1'))))
    ),
    readDocument: vi.fn(),
    writeDocument: vi.fn((_rel, document) => Promise.resolve(ok(document))),
    readDiagram: vi.fn(),
    writeDiagram: vi.fn((_rel, diagram) => Promise.resolve(ok(diagram))),
    rename: vi.fn((relPath: string, newName: string) => {
      const ext = /\.ar(doc|diag)$/.exec(relPath)?.[0] ?? ''
      return Promise.resolve(ok(ref(join(parent(relPath), `${newName}${ext}`))))
    }),
    move: vi.fn((relPath: string, target: string) =>
      Promise.resolve(ok(ref(join(target, relPath.split('/').pop() ?? relPath))))
    ),
    delete: vi.fn(() => Promise.resolve(ok(null)))
  }
}
