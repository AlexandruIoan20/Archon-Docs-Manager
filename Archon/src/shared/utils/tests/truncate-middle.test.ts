import { describe, expect, it } from 'vitest'
import { truncateMiddle } from '../truncate-middle'

describe('truncateMiddle', () => {
  it('leaves short paths unchanged', () => {
    expect(truncateMiddle('Runbooks/ir-policy.ardoc', 40)).toBe('Runbooks/ir-policy.ardoc')
  })

  it('keeps the first folder and the full file name', () => {
    expect(truncateMiddle('Playbooks/Phishing/triage.ardiag', 30)).toBe('Playbooks/…/triage.ardiag')
  })

  it('keeps as many trailing folders as fit', () => {
    const path = 'Architecture/A/B/Reference/flow.ardiag'
    expect(truncateMiddle(path, 37)).toBe('Architecture/…/Reference/flow.ardiag')
    expect(truncateMiddle(path, 35)).toBe('Architecture/…/flow.ardiag')
  })

  it('drops the first folder when it does not fit', () => {
    expect(truncateMiddle('VeryLongWorkspaceFolder/x/triage.ardiag', 20)).toBe('…/triage.ardiag')
  })

  it('shortens the file name itself as a last resort and keeps its extension', () => {
    const result = truncateMiddle('Playbooks/an-extremely-long-diagram-name.ardiag', 16)
    expect(result).toHaveLength(16)
    expect(result.endsWith('ardiag')).toBe(true)
    expect(result).toContain('…')
  })

  it('never exceeds the limit', () => {
    const path = 'a-folder/another-folder/third/file-with-a-long-name.ardoc'
    for (let max = 1; max <= path.length; max++) {
      expect(truncateMiddle(path, max).length).toBeLessThanOrEqual(max)
    }
  })
})
