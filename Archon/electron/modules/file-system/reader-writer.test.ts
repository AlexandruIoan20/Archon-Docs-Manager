// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { z } from 'zod'
import type { FolderEntry, TreeEntry } from '@/core/types'
import { isOwnWrite } from './own-writes'
import { readJson, readTree } from './reader'
import { ensureDir, writeJsonAtomic } from './writer'

const names = (folder: FolderEntry): string[] => folder.children.map((entry) => entry.name)
const child = (folder: FolderEntry, name: string): TreeEntry | undefined =>
  folder.children.find((entry) => entry.name === name)

describe('file-system reader & writer', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ar-ws-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  const touch = (rel: string, content = '{}'): void => {
    const parts = rel.split('/')
    const name = parts.pop() as string
    const dir = join(root, ...parts)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, name), content)
  }

  it('lists folders first, then files, alphabetically and case-insensitively', async () => {
    touch('workspace.arws')
    touch('b-doc.ardoc')
    touch('A-diagram.ardiag')
    touch('runbooks/x.ardoc')
    touch('Playbooks/Phishing/triage.ardiag')
    touch('file10.ardoc')
    touch('file2.ardoc')

    const tree = await readTree(root)
    expect(tree.relPath).toBe('')
    expect(names(tree)).toEqual([
      'Playbooks',
      'runbooks',
      'A-diagram.ardiag',
      'b-doc.ardoc',
      'file2.ardoc',
      'file10.ardoc'
    ])

    const playbooks = child(tree, 'Playbooks') as FolderEntry
    const phishing = child(playbooks, 'Phishing') as FolderEntry
    expect(phishing.relPath).toBe('Playbooks/Phishing')
    expect(phishing.children[0]).toEqual({
      kind: 'ardiag',
      name: 'triage.ardiag',
      baseName: 'triage',
      relPath: 'Playbooks/Phishing/triage.ardiag'
    })
  })

  it('ignores hidden entries and foreign files', async () => {
    touch('.git/config.ardoc')
    touch('.draft.ardoc')
    touch('notes.md', '# hi')
    touch('image.png', '')
    touch('Docs/readme.txt', '')
    touch('Docs/keep.ardoc')

    const tree = await readTree(root)
    expect(names(tree)).toEqual(['Docs'])
    expect(names(child(tree, 'Docs') as FolderEntry)).toEqual(['keep.ardoc'])
  })

  it('keeps empty folders', async () => {
    mkdirSync(join(root, 'Empty'))
    const tree = await readTree(root)
    expect(child(tree, 'Empty')).toEqual({
      kind: 'folder',
      name: 'Empty',
      relPath: 'Empty',
      children: []
    })
  })

  it('writes JSON atomically without leaving temp files', async () => {
    const target = join(root, 'doc.ardoc')
    await writeJsonAtomic(target, { title: 'One' })
    await writeJsonAtomic(target, { title: 'Two' })

    expect(JSON.parse(readFileSync(target, 'utf8'))).toEqual({ title: 'Two' })
    expect(readdirSync(root)).toEqual(['doc.ardoc'])
    expect(isOwnWrite(target)).toBe(true)
  })

  it('creates nested folders', async () => {
    await ensureDir(join(root, 'a', 'b'))
    expect(readdirSync(join(root, 'a'))).toEqual(['b'])
  })

  describe('readJson', () => {
    const schema = z.object({ title: z.string() })

    it('returns validated data', async () => {
      touch('ok.ardoc', '{"title":"Hello"}')
      expect(await readJson(join(root, 'ok.ardoc'), schema)).toEqual({ title: 'Hello' })
    })

    it('fails with NOT_FOUND for a missing file', async () => {
      await expect(readJson(join(root, 'nope.ardoc'), schema)).rejects.toMatchObject({
        code: 'NOT_FOUND'
      })
    })

    it('fails with INVALID_FILE for broken JSON or a wrong shape', async () => {
      touch('broken.ardoc', '{ "title": ')
      touch('wrong.ardoc', '{"title": 3}')
      await expect(readJson(join(root, 'broken.ardoc'), schema)).rejects.toMatchObject({
        code: 'INVALID_FILE'
      })
      await expect(readJson(join(root, 'wrong.ardoc'), schema)).rejects.toMatchObject({
        code: 'INVALID_FILE',
        details: [expect.objectContaining({ path: 'title' })]
      })
    })
  })
})
