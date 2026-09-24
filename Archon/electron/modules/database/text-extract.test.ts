// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { extractText } from './text-extract'

const text = (value: string): object => ({ type: 'text', text: value })

describe('extractText', () => {
  it('reads headings, paragraphs, lists and code blocks in order', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [text('Containment')] },
        {
          type: 'paragraph',
          content: [text('Isolate the '), { type: 'text', text: 'host', marks: [{ type: 'bold' }] }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [text('Block IOC')] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [text('Reset creds')] }] }
          ]
        },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [text('edr isolate --host X')] }
      ]
    }
    expect(extractText(doc)).toBe(
      'Containment\nIsolate the host\nBlock IOC\nReset creds\nedr isolate --host X'
    )
  })

  it('keeps words from neighbouring blocks apart and honours hard breaks', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [text('one'), { type: 'hardBreak' }, text('two')] },
        { type: 'paragraph', content: [text('three')] }
      ]
    }
    expect(extractText(doc)).toBe('one\ntwo\nthree')
  })

  it('walks unknown node types and ignores junk', () => {
    expect(
      extractText({ type: 'doc', content: [{ type: 'callout', content: [text('Note')] }] })
    ).toBe('Note')
    expect(extractText(null)).toBe('')
    expect(extractText({ type: 'doc', content: 'nope' })).toBe('')
    expect(extractText({ type: 'text', text: 42 })).toBe('')
  })

  it('stops on absurdly deep input', () => {
    let node: object = text('deep')
    for (let i = 0; i < 1000; i++) node = { type: 'blockquote', content: [node] }
    expect(() => extractText(node)).not.toThrow()
  })
})
