import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn<(id: string, source: string) => Promise<{ svg: string }>>()
}))
vi.mock('mermaid', () => ({ default: mermaid }))

const { errorLine, renderMermaid } = await import('../mermaid-loader')

describe('renderMermaid', () => {
  beforeEach(() => {
    mermaid.initialize.mockReset()
    mermaid.render.mockReset()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders with the strict base theme and the given colors', async () => {
    mermaid.render.mockResolvedValue({ svg: '<svg id="x"></svg>' })
    const result = await renderMermaid('sequenceDiagram', { primaryColor: '#111111' })
    expect(result).toEqual({ svg: '<svg id="x"></svg>' })
    expect(mermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: { primaryColor: '#111111' }
    })
  })

  it('uses a new id for every render', async () => {
    mermaid.render.mockResolvedValue({ svg: '<svg></svg>' })
    await renderMermaid('a', {})
    await renderMermaid('b', {})
    const [first, second] = mermaid.render.mock.calls.map(([id]) => id)
    expect(first).not.toBe(second)
  })

  it('returns the error with its line, and removes what Mermaid left behind', async () => {
    mermaid.render.mockImplementation((id) => {
      const scratch = document.createElement('div')
      scratch.id = `d${id}`
      document.body.append(scratch)
      return Promise.reject(
        Object.assign(new Error('Parse error on line 3:\n...A->>\n---^'), {
          hash: { loc: { first_line: 3 } }
        })
      )
    })
    const result = await renderMermaid('sequenceDiagram\n  A->>B: x\n  A->>', {})
    expect(result).toEqual({ error: { message: 'Parse error on line 3:', line: 3 } })
    expect(document.body.children).toHaveLength(0)
  })
})

describe('errorLine', () => {
  it('reads the line from the message when there is no location', () => {
    expect(errorLine(new Error('Lexical error on line 7. Unrecognized text.'))).toBe(7)
    expect(errorLine(new Error('No diagram type detected'))).toBeNull()
  })
})
