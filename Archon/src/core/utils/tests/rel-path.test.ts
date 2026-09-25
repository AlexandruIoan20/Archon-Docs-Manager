import { describe, expect, it } from 'vitest'
import { baseName, isSameOrInside, parentPath, remapPath } from '../rel-path'

describe('rel-path helpers', () => {
  it('knows what lives inside a folder', () => {
    expect(isSameOrInside('Playbooks/a.ardoc', 'Playbooks')).toBe(true)
    expect(isSameOrInside('Playbooks', 'Playbooks')).toBe(true)
    expect(isSameOrInside('Playbooks-old/a.ardoc', 'Playbooks')).toBe(false)
    expect(isSameOrInside('anything', '')).toBe(true)
  })

  it('remaps paths after a rename or move', () => {
    expect(remapPath('Playbooks', 'Playbooks', 'Plays')).toBe('Plays')
    expect(remapPath('Playbooks/Phishing/x.ardiag', 'Playbooks', 'Archive/Playbooks')).toBe(
      'Archive/Playbooks/Phishing/x.ardiag'
    )
    expect(remapPath('Playbooks-old/x', 'Playbooks', 'Plays')).toBe('Playbooks-old/x')
  })

  it('splits parent and name', () => {
    expect(parentPath('a/b/c.ardoc')).toBe('a/b')
    expect(parentPath('c.ardoc')).toBe('')
    expect(baseName('a/b/c.ardoc')).toBe('c.ardoc')
    expect(baseName('c.ardoc')).toBe('c.ardoc')
  })
})
