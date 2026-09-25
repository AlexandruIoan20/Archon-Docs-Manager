import type { Mermaid } from 'mermaid'
import type { MermaidThemeVariables } from './theme-variables'

export type MermaidResult = { svg: string } | { error: { message: string; line: number | null } }

let loading: Promise<Mermaid> | null = null
let renders = 0

/** Mermaid, imported on first use: it is large and only Mermaid diagrams need it. */
export function loadMermaid(): Promise<Mermaid> {
  loading ??= import('mermaid').then((module) => module.default)
  // A failed import may succeed later (e.g. after a reload of the chunk).
  loading.catch(() => {
    loading = null
  })
  return loading
}

/** The 1-based line of a Mermaid parse error, when it says. */
export function errorLine(error: unknown): number | null {
  const hash = (error as { hash?: { loc?: { first_line?: number }; line?: number } }).hash
  const fromHash = hash?.loc?.first_line ?? (hash?.line === undefined ? undefined : hash.line + 1)
  if (typeof fromHash === 'number') return fromHash
  const match = /line (\d+)/i.exec(error instanceof Error ? error.message : String(error))
  return match ? Number(match[1]) : null
}

function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.split('\n').find((line) => line.trim() !== '') ?? 'Syntax error'
}

export interface MermaidRenderOptions {
  /**
   * `false` draws labels as SVG text instead of HTML in `<foreignObject>`: an
   * SVG with HTML in it cannot be drawn to a canvas (the PNG export).
   */
  htmlLabels?: boolean
}

/** Renders `source` with the app theme: the SVG, or the error and its line. */
export async function renderMermaid(
  source: string,
  themeVariables: MermaidThemeVariables,
  { htmlLabels }: MermaidRenderOptions = {}
): Promise<MermaidResult> {
  const mermaid = await loadMermaid()
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables,
    ...(htmlLabels === undefined ? {} : { htmlLabels })
  })
  // A new id per render: tabs rendering at once never share an element.
  const id = `ar-mermaid-${++renders}`
  try {
    const { svg } = await mermaid.render(id, source)
    return { svg }
  } catch (error) {
    return { error: { message: firstLine(error), line: errorLine(error) } }
  } finally {
    // On an error Mermaid leaves its scratch element in the body.
    document.getElementById(id)?.remove()
    document.getElementById(`d${id}`)?.remove()
  }
}
