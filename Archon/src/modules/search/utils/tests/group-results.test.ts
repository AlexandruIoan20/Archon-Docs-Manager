import { describe, expect, it } from 'vitest'
import type { SearchResult } from '@/core/types'
import { SEARCH_MATCH_END as E, SEARCH_MATCH_START as S } from '@/core/constants/search.constants'
import { groupResults, titleMatches } from '../group-results'
import { snippetParts } from '../snippet-parts'

const result = (over: Partial<SearchResult>): SearchResult => ({
  fileId: 'f1',
  relPath: 'Playbooks/phishing-triage.ardiag',
  kind: 'ardiag',
  fileTitle: 'Phishing triage',
  nodeId: null,
  nodeLabel: null,
  snippet: '',
  score: -1,
  ...over
})

describe('groupResults', () => {
  it('puts nodes, title matches and content matches in their groups, in that order', () => {
    const groups = groupResults(
      [
        result({ nodeId: 'N2', nodeLabel: 'Contain Host' }),
        result({ fileId: 'f2', fileTitle: 'Runbook', kind: 'ardoc' }),
        result({ fileId: 'f3', fileTitle: 'Phishing notes', kind: 'ardoc' })
      ],
      'phish'
    )
    expect(groups.map((g) => [g.id, g.results.map((r) => r.fileId)])).toEqual([
      ['files', ['f3']],
      ['nodes', ['f1']],
      ['content', ['f2']]
    ])
  })

  it('leaves out empty groups', () => {
    expect(groupResults([], 'x')).toEqual([])
  })

  it('matches titles by word prefix, every word', () => {
    expect(titleMatches('Phishing triage', 'tri phi')).toBe(true)
    expect(titleMatches('Phishing triage', 'hing')).toBe(false)
  })
})

describe('snippetParts', () => {
  it('splits on the match markers', () => {
    expect(snippetParts(`…to ${S}isolate${E} the host`)).toEqual([
      { text: '…to ', match: false },
      { text: 'isolate', match: true },
      { text: ' the host', match: false }
    ])
  })

  it('keeps markup as plain text', () => {
    expect(snippetParts(`<img src=x onerror="alert(1)"> ${S}x${E}`)[0]).toEqual({
      text: '<img src=x onerror="alert(1)"> ',
      match: false
    })
  })
})
