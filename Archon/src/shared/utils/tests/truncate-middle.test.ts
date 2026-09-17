import { describe, expect, it } from 'vitest'
import { truncateMiddle } from '../truncate-middle'

describe('truncateMiddle', () => {
  it('leaves short paths unchanged', () => {
    expect(truncateMiddle('Runbooks/ir-policy.soardoc', 40)).toBe('Runbooks/ir-policy.soardoc')
  })

  it('keeps the first folder and the full file name', () => {
    expect(truncateMiddle('Playbooks/Phishing/triage.soardiag', 30)).toBe(
      'Playbooks/…/triage.soardiag'
    )
  })

  it('keeps as many trailing folders as fit', () => {
    const path = 'Architecture/A/B/Reference/flow.soardiag'
    expect(truncateMiddle(path, 39)).toBe('Architecture/…/Reference/flow.soardiag')
    expect(truncateMiddle(path, 37)).toBe('Architecture/…/flow.soardiag')
  })

  it('drops the first folder when it does not fit', () => {
    expect(truncateMiddle('VeryLongWorkspaceFolder/x/triage.soardiag', 20)).toBe(
      '…/triage.soardiag'
    )
  })

  it('shortens the file name itself as a last resort and keeps its extension', () => {
    const result = truncateMiddle('Playbooks/an-extremely-long-diagram-name.soardiag', 16)
    expect(result).toHaveLength(16)
    expect(result.endsWith('soardiag')).toBe(true)
    expect(result).toContain('…')
  })

  it('never exceeds the limit', () => {
    const path = 'a-folder/another-folder/third/file-with-a-long-name.soardoc'
    for (let max = 1; max <= path.length; max++) {
      expect(truncateMiddle(path, max).length).toBeLessThanOrEqual(max)
    }
  })
})
