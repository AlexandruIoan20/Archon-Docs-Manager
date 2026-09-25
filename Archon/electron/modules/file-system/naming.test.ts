// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { availableName, fileNameProblem, nextAvailableName, slugify } from './naming'

describe('fileNameProblem', () => {
  it.each(['incident-response', 'Phishing Playbook', 'v2.1 notes', 'ünïcödé'])(
    'accepts %s',
    (name) => {
      expect(fileNameProblem(name)).toBeNull()
    }
  )

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['a/b', 'contain'],
    ['a\\b', 'contain'],
    ['what?', 'contain'],
    ['tab\there', 'contain'],
    ['.hidden', 'dot'],
    ['trailing.', 'end'],
    ['trailing ', 'end'],
    ['CON', 'reserved'],
    ['nul.txt', 'reserved'],
    ['com1', 'reserved'],
    ['x'.repeat(121), 'longer']
  ])('rejects %j', (name, fragment) => {
    expect(fileNameProblem(name)?.toLowerCase()).toContain(fragment)
  })
})

describe('slugify', () => {
  it('makes titles file-name safe', () => {
    expect(slugify('Incident Response — Phase 2!')).toBe('incident-response-phase-2')
    expect(slugify('Răspuns la incidente')).toBe('raspuns-la-incidente')
    expect(slugify('***')).toBe('untitled')
    expect(slugify('con')).toBe('untitled')
    expect(slugify('', 'flowchart')).toBe('flowchart')
    expect(slugify('x'.repeat(100))).toHaveLength(60)
  })
})

describe('numbered names', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'soar-naming-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('starts at 1 and continues after the highest number', async () => {
    expect(await nextAvailableName(dir, 'untitled', '.ardoc')).toBe('untitled-1.ardoc')
    writeFileSync(join(dir, 'untitled-1.ardoc'), '')
    writeFileSync(join(dir, 'Untitled-7.ardoc'), '')
    writeFileSync(join(dir, 'untitled-9.ardiag'), '')
    writeFileSync(join(dir, 'untitled-x.ardoc'), '')
    expect(await nextAvailableName(dir, 'untitled', '.ardoc')).toBe('untitled-8.ardoc')
  })

  it('numbers folders without an extension', async () => {
    mkdirSync(join(dir, 'new-folder-2'))
    writeFileSync(join(dir, 'new-folder-5.ardoc'), '')
    expect(await nextAvailableName(dir, 'new-folder', '')).toBe('new-folder-3')
  })

  it('uses the plain name when it is free', async () => {
    expect(await availableName(dir, 'policy', '.ardoc')).toBe('policy.ardoc')
    writeFileSync(join(dir, 'Policy.ardoc'), '')
    expect(await availableName(dir, 'policy', '.ardoc')).toBe('policy-1.ardoc')
  })
})
