import { describe, expect, it } from 'vitest'
import { countWords } from '../word-count'

describe('countWords', () => {
  it('is 0 for empty or blank text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
    expect(countWords('— … !')).toBe(0)
  })

  it('ignores repeated whitespace and punctuation', () => {
    expect(countWords('  Isolate   the\nhost,  then\t\treport. ')).toBe(5)
  })

  it('keeps words with diacritics, apostrophes and hyphens whole', () => {
    expect(countWords('Răspunsul la incident și știința datelor')).toBe(6)
    expect(countWords("don't re-run l’apel")).toBe(3)
  })

  it('counts numbers', () => {
    expect(countWords('Step 2 of 10')).toBe(4)
  })
})
