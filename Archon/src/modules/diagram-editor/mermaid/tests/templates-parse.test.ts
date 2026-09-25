import { describe, expect, it } from 'vitest'
import mermaid from 'mermaid'
import { MERMAID_TEMPLATES } from '../templates'

// The real Mermaid parser: every template must be valid Mermaid.
describe('Mermaid templates, parsed', () => {
  for (const [type, source] of Object.entries(MERMAID_TEMPLATES)) {
    it(`parses the ${type} template`, async () => {
      await expect(mermaid.parse(source)).resolves.toBeTruthy()
    })
  }
})
