// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  isHidden,
  joinRel,
  normalizeRelPath,
  parentRel,
  resolveInWorkspace,
  toRelPath
} from './paths'

describe('normalizeRelPath', () => {
  it('normalizes separators and dots', () => {
    expect(normalizeRelPath('Playbooks\\Phishing/./triage.ardiag')).toBe(
      'Playbooks/Phishing/triage.ardiag'
    )
    expect(normalizeRelPath('')).toBe('')
    expect(normalizeRelPath('a//b/')).toBe('a/b')
  })

  it.each([
    '../../etc/passwd',
    'a/../../b',
    'a\\..\\b',
    '/etc/passwd',
    '\\\\server\\share',
    'C:\\Windows',
    'c:/Windows',
    'a\0b'
  ])('rejects %s', (path) => {
    expect(() => normalizeRelPath(path)).toThrow(
      expect.objectContaining({ code: 'PATH_OUTSIDE_WORKSPACE' })
    )
  })

  it('rejects non-string input', () => {
    expect(() => normalizeRelPath(42)).toThrow(
      expect.objectContaining({ code: 'PATH_OUTSIDE_WORKSPACE' })
    )
  })
})

describe('resolveInWorkspace', () => {
  let base: string
  let root: string

  beforeEach(() => {
    base = realpathSync(mkdtempSync(join(tmpdir(), 'soar-paths-')))
    root = join(base, 'ws')
    mkdirSync(join(root, 'Playbooks'), { recursive: true })
    mkdirSync(join(base, 'secret'))
  })

  afterEach(() => {
    rmSync(base, { recursive: true, force: true })
  })

  it('resolves existing and not-yet-existing paths inside the root', async () => {
    expect(await resolveInWorkspace(root, 'Playbooks')).toBe(join(root, 'Playbooks'))
    expect(await resolveInWorkspace(root, 'Playbooks/new/file.ardoc')).toBe(
      join(root, 'Playbooks', 'new', 'file.ardoc')
    )
    expect(await resolveInWorkspace(root, '')).toBe(root)
  })

  it('rejects ../../etc/passwd with PATH_OUTSIDE_WORKSPACE', async () => {
    await expect(resolveInWorkspace(root, '../../etc/passwd')).rejects.toMatchObject({
      code: 'PATH_OUTSIDE_WORKSPACE'
    })
  })

  it('rejects a symlink that leads out of the root', async () => {
    symlinkSync(join(base, 'secret'), join(root, 'escape'), 'dir')
    await expect(resolveInWorkspace(root, 'escape')).rejects.toMatchObject({
      code: 'PATH_OUTSIDE_WORKSPACE'
    })
    await expect(resolveInWorkspace(root, 'escape/new.ardoc')).rejects.toMatchObject({
      code: 'PATH_OUTSIDE_WORKSPACE'
    })
  })

  it('accepts a symlink that stays inside the root', async () => {
    symlinkSync(join(root, 'Playbooks'), join(root, 'alias'), 'dir')
    expect(await resolveInWorkspace(root, 'alias')).toBe(join(root, 'alias'))
  })
})

describe('path helpers', () => {
  it('converts absolute paths to relative ones', () => {
    expect(toRelPath(join('/ws'), join('/ws', 'a', 'b.ardoc'))).toBe('a/b.ardoc')
  })

  it('knows hidden names, parents and joins', () => {
    expect(isHidden('.git')).toBe(true)
    expect(isHidden('Runbooks')).toBe(false)
    expect(parentRel('a/b/c.ardoc')).toBe('a/b')
    expect(parentRel('c.ardoc')).toBe('')
    expect(joinRel('', 'x')).toBe('x')
    expect(joinRel('a/b', 'x')).toBe('a/b/x')
  })
})
