// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createFolder, deleteEntry, moveEntry, renameEntry } from './entries'

describe('entries', () => {
  let root: string

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'soar-entries-')))
    mkdirSync(join(root, 'Playbooks', 'Phishing'), { recursive: true })
    mkdirSync(join(root, 'Runbooks'))
    writeFileSync(join(root, 'Playbooks', 'triage.soardiag'), '{}')
    writeFileSync(join(root, 'policy.soardoc'), '{}')
    writeFileSync(join(root, 'workspace.soarws'), '{}')
    writeFileSync(join(root, 'notes.md'), '')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  describe('createFolder', () => {
    it('creates new-folder-N', async () => {
      expect(await createFolder(root, 'Playbooks')).toEqual({
        relPath: 'Playbooks/new-folder-1',
        name: 'new-folder-1'
      })
      expect((await createFolder(root, 'Playbooks')).name).toBe('new-folder-2')
    })

    it('creates a named folder and refuses duplicates and bad names', async () => {
      expect((await createFolder(root, '', 'Architecture')).relPath).toBe('Architecture')
      await expect(createFolder(root, '', 'Runbooks')).rejects.toMatchObject({
        code: 'ALREADY_EXISTS'
      })
      await expect(createFolder(root, '', 'a:b')).rejects.toMatchObject({ code: 'INVALID_NAME' })
    })
  })

  describe('renameEntry', () => {
    it('keeps the extension of files', async () => {
      expect(await renameEntry(root, 'policy.soardoc', 'Incident Policy')).toEqual({
        relPath: 'Incident Policy.soardoc',
        name: 'Incident Policy.soardoc'
      })
      const typedExt = await renameEntry(root, 'Playbooks/triage.soardiag', 'flow.soardiag')
      expect(typedExt.relPath).toBe('Playbooks/flow.soardiag')
    })

    it('renames folders', async () => {
      expect((await renameEntry(root, 'Playbooks/Phishing', 'Email')).relPath).toBe(
        'Playbooks/Email'
      )
    })

    it('allows a case-only rename', async () => {
      expect((await renameEntry(root, 'Runbooks', 'runbooks')).relPath).toBe('runbooks')
      expect(readdirSync(root)).toContain('runbooks')
    })

    it('refuses invalid names without touching the disk', async () => {
      await expect(renameEntry(root, 'policy.soardoc', 'bad/name')).rejects.toMatchObject({
        code: 'INVALID_NAME'
      })
      await expect(renameEntry(root, 'policy.soardoc', '  ')).rejects.toMatchObject({
        code: 'INVALID_NAME'
      })
      expect(existsSync(join(root, 'policy.soardoc'))).toBe(true)
    })

    it('refuses to overwrite and to touch non-workspace entries', async () => {
      writeFileSync(join(root, 'other.soardoc'), '{}')
      await expect(renameEntry(root, 'policy.soardoc', 'other')).rejects.toMatchObject({
        code: 'ALREADY_EXISTS'
      })
      await expect(renameEntry(root, 'workspace.soarws', 'x')).rejects.toMatchObject({
        code: 'INVALID_ARGUMENT'
      })
      await expect(renameEntry(root, 'notes.md', 'x')).rejects.toMatchObject({
        code: 'INVALID_ARGUMENT'
      })
      await expect(renameEntry(root, '', 'x')).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
      await expect(renameEntry(root, 'missing.soardoc', 'x')).rejects.toMatchObject({
        code: 'NOT_FOUND'
      })
    })
  })

  describe('moveEntry', () => {
    it('moves files and folders', async () => {
      expect((await moveEntry(root, 'policy.soardoc', 'Runbooks')).relPath).toBe(
        'Runbooks/policy.soardoc'
      )
      expect((await moveEntry(root, 'Playbooks/Phishing', '')).relPath).toBe('Phishing')
    })

    it('refuses to move a folder into itself or a descendant', async () => {
      await expect(moveEntry(root, 'Playbooks', 'Playbooks')).rejects.toMatchObject({
        code: 'INVALID_MOVE'
      })
      await expect(moveEntry(root, 'Playbooks', 'Playbooks/Phishing')).rejects.toMatchObject({
        code: 'INVALID_MOVE'
      })
    })

    it('refuses name clashes and missing targets', async () => {
      writeFileSync(join(root, 'Runbooks', 'policy.soardoc'), '{}')
      await expect(moveEntry(root, 'policy.soardoc', 'Runbooks')).rejects.toMatchObject({
        code: 'ALREADY_EXISTS'
      })
      await expect(moveEntry(root, 'policy.soardoc', 'Nowhere')).rejects.toMatchObject({
        code: 'NOT_FOUND'
      })
    })

    it('does nothing when the entry is already there', async () => {
      expect((await moveEntry(root, 'Playbooks/triage.soardiag', 'Playbooks')).relPath).toBe(
        'Playbooks/triage.soardiag'
      )
    })
  })

  describe('deleteEntry', () => {
    it('hands the absolute path to the trash function', async () => {
      const trash = vi.fn(async () => undefined)
      await deleteEntry(root, 'Playbooks', trash)
      expect(trash).toHaveBeenCalledWith(join(root, 'Playbooks'))
    })

    it('never trashes the root or the workspace file', async () => {
      const trash = vi.fn(async () => undefined)
      await expect(deleteEntry(root, '', trash)).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' })
      await expect(deleteEntry(root, 'workspace.soarws', trash)).rejects.toMatchObject({
        code: 'INVALID_ARGUMENT'
      })
      await expect(deleteEntry(root, '../x', trash)).rejects.toMatchObject({
        code: 'PATH_OUTSIDE_WORKSPACE'
      })
      expect(trash).not.toHaveBeenCalled()
    })
  })
})
