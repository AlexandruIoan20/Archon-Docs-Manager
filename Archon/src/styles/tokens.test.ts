import { describe, expect, it } from 'vitest'
import dark from './themes/dark.css?raw'
import light from './themes/light.css?raw'

const TOKEN_RE = /--([a-z0-9-]+)\s*:/gi

function extractTokens(css: string): string[] {
  return [...css.matchAll(TOKEN_RE)].map((match) => match[1])
}

describe('design tokens', () => {
  it('keeps dark and light themes in sync', () => {
    const missing = extractTokens(dark).filter((token) => !extractTokens(light).includes(token))
    expect(missing).toEqual([])
  })
})
