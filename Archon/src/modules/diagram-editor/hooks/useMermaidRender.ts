import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useDebouncedCallback } from '@/shared/hooks/useDebounce'
import { renderMermaid } from '../mermaid/mermaid-loader'
import { readThemeVariables } from '../mermaid/theme-variables'
import { useThemeKey } from './useThemeKey'

export const MERMAID_RENDER_DELAY_MS = 300

export interface MermaidRender {
  /** The last source that rendered; kept while the current one has an error. */
  svg: string | null
  error: { message: string; line: number | null } | null
  /** Mermaid is loading or the first render is under way. */
  loading: boolean
}

/**
 * Renders `source` 300ms after the last change, and again when the theme
 * changes. Results of a render overtaken by a newer one are dropped.
 */
export function useMermaidRender(source: string): MermaidRender {
  const themeKey = useThemeKey()
  const [result, setResult] = useState<MermaidRender>({ svg: null, error: null, loading: true })
  const latest = useRef(0)

  const run = (text: string): void => {
    const ticket = ++latest.current
    void renderMermaid(text, readThemeVariables()).then(
      (rendered) => {
        if (ticket !== latest.current) return
        setResult((previous) =>
          'svg' in rendered
            ? { svg: rendered.svg, error: null, loading: false }
            : { svg: previous.svg, error: rendered.error, loading: false }
        )
      },
      (error: unknown) => {
        if (ticket !== latest.current) return
        const message = `Mermaid could not be loaded: ${(error as Error).message}`
        setResult((previous) => ({ ...previous, error: { message, line: null }, loading: false }))
      }
    )
  }
  const debounced = useDebouncedCallback(run, MERMAID_RENDER_DELAY_MS)
  const renderNow = useEffectEvent(() => {
    debounced.cancel()
    run(source)
  })

  // The first render and a theme change go at once; typing waits for a pause.
  const rendered = useRef(false)
  useEffect(() => {
    if (rendered.current) {
      debounced(source)
    } else {
      rendered.current = true
      renderNow()
    }
  }, [source, debounced])

  const themeSeen = useRef(themeKey)
  useEffect(() => {
    if (themeSeen.current === themeKey) return
    themeSeen.current = themeKey
    renderNow()
  }, [themeKey])

  return result
}
