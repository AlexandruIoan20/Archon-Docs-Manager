import { describe, expect, it } from 'vitest'
import { baseName, isSameOrInside, parentPath, remapPath } from '../rel-path'

describe('rel-path helpers', () => {
  it('knows what lives inside a folder', () => {
    expect(isSameOrInside('Playbooks/a.soardoc', 'Playbooks')).toBe(true)
    expect(isSameOrInside('Playbooks', 'Playbooks')).toBe(true)
    expect(isSameOrInside('Playbooks-old/a.soardoc', 'Playbooks')).toBe(false)
    expect(isSameOrInside('anything', '')).toBe(true)
  })

  it('remaps paths after a rename or move', () => {
    expect(remapPath('Playbooks', 'Playbooks', 'Plays')).toBe('Plays')
    expect(remapPath('Playbooks/Phishing/x.soardiag', 'Playbooks', 'Archive/Playbooks')).toBe(
      'Archive/Playbooks/Phishing/x.soardiag'
    )
    expect(remapPath('Playbooks-old/x', 'Playbooks', 'Plays')).toBe('Playbooks-old/x')
  })

  it('splits parent and name', () => {
    expect(parentPath('a/b/c.soardoc')).toBe('a/b')
    expect(parentPath('c.soardoc')).toBe('')
    expect(baseName('a/b/c.soardoc')).toBe('c.soardoc')
    expect(baseName('c.soardoc')).toBe('c.soardoc')
  })
})
