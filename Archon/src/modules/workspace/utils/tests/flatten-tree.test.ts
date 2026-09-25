import { describe, expect, it } from 'vitest'
import { SAMPLE_TREE } from '@/test/sample-tree'
import {
  countFiles,
  fileFilter,
  flattenTree,
  parentRowIndex,
  type FlattenOptions,
  type TreeRow
} from '../flatten-tree'

const OPTIONS: FlattenOptions = {
  expanded: {},
  query: '',
  sideTab: 'files',
  activePath: null,
  targetFolder: ''
}

const flat = (options: Partial<FlattenOptions> = {}): TreeRow[] =>
  flattenTree(SAMPLE_TREE, { ...OPTIONS, ...options })

/** `depth:name` per row, compact enough to compare whole trees. */
const shape = (rows: TreeRow[]): string[] => rows.map((row) => `${row.depth}:${row.entry.name}`)

describe('flattenTree', () => {
  it('shows only top-level entries when nothing is expanded', () => {
    expect(shape(flat())).toEqual([
      '0:Architecture',
      '0:Playbooks',
      '0:Runbooks',
      '0:Empty',
      '0:incident-policy.ardoc'
    ])
  })

  it('walks into expanded folders with increasing depth', () => {
    const rows = flat({ expanded: { Playbooks: true, 'Playbooks/Phishing': true } })
    expect(shape(rows)).toEqual([
      '0:Architecture',
      '0:Playbooks',
      '1:Phishing',
      '2:phishing-triage.ardiag',
      '2:triage-notes.ardoc',
      '1:Ransomware',
      '0:Runbooks',
      '0:Empty',
      '0:incident-policy.ardoc'
    ])
  })

  it('does not show children of a collapsed folder even if they are expanded', () => {
    const rows = flat({ expanded: { 'Playbooks/Phishing': true } })
    expect(shape(rows)).not.toContain('1:Phishing')
  })

  it('counts files recursively', () => {
    const counts = Object.fromEntries(
      flat().flatMap((row) => (row.type === 'folder' ? [[row.entry.name, row.fileCount]] : []))
    )
    expect(counts).toEqual({ Architecture: 2, Playbooks: 3, Runbooks: 1, Empty: 0 })
  })

  it('hides documents on the Diagrams tab and counts only diagrams', () => {
    const rows = flat({ sideTab: 'diagrams', expanded: { Runbooks: true, Playbooks: true } })
    expect(shape(rows)).toEqual([
      '0:Architecture',
      '0:Playbooks',
      '1:Phishing',
      '1:Ransomware',
      '0:Runbooks',
      '0:Empty'
    ])
    const playbooks = rows[1]
    expect(playbooks?.type === 'folder' && playbooks.fileCount).toBe(2)
    const runbooks = rows[4]
    expect(runbooks?.type === 'folder' && runbooks.fileCount).toBe(0)
  })

  it('expands every folder with matches and hides the others while searching', () => {
    expect(shape(flat({ query: 'TRIAGE' }))).toEqual([
      '0:Playbooks',
      '1:Phishing',
      '2:phishing-triage.ardiag',
      '2:triage-notes.ardoc'
    ])
  })

  it('combines search and the Diagrams tab', () => {
    expect(shape(flat({ query: 'triage', sideTab: 'diagrams' }))).toEqual([
      '0:Playbooks',
      '1:Phishing',
      '2:phishing-triage.ardiag'
    ])
  })

  it('returns no rows when nothing matches', () => {
    expect(flat({ query: 'nothing-like-this' })).toEqual([])
  })

  it('ignores a whitespace-only query', () => {
    expect(shape(flat({ query: '   ' }))).toEqual(shape(flat()))
  })

  it('marks the active file and the target folder', () => {
    const rows = flat({
      expanded: { Runbooks: true },
      activePath: 'Runbooks/on-call.ardoc',
      targetFolder: 'Runbooks'
    })
    const runbooks = rows.find((row) => row.entry.name === 'Runbooks')
    const onCall = rows.find((row) => row.entry.name === 'on-call.ardoc')
    expect(runbooks).toMatchObject({ type: 'folder', isTarget: true, expanded: true })
    expect(onCall).toMatchObject({ type: 'file', isActive: true, depth: 1 })
    expect(rows.filter((row) => row.type === 'folder' && row.isTarget)).toHaveLength(1)
  })
})

describe('tree helpers', () => {
  it('matches file names case-insensitively, without the extension', () => {
    const visible = fileFilter('files', 'ARDOC')
    expect(countFiles(SAMPLE_TREE, visible)).toBe(0)
    expect(countFiles(SAMPLE_TREE, fileFilter('files', ''))).toBe(7)
  })

  it('finds the parent row', () => {
    const rows = flat({ expanded: { Playbooks: true, 'Playbooks/Phishing': true } })
    expect(parentRowIndex(rows, 3)).toBe(2)
    expect(parentRowIndex(rows, 2)).toBe(1)
    expect(parentRowIndex(rows, 1)).toBe(-1)
  })
})
