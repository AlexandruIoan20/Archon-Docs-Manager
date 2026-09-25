/** Mermaid's `themeVariables` for the `base` theme. */
export type MermaidThemeVariables = Record<string, string | boolean>

// Plain hex tokens only: Mermaid derives shades from them, and the computed
// value of a `color-mix()` token is not a color it can read.
const read = (styles: CSSStyleDeclaration, token: string, fallback: string): string =>
  styles.getPropertyValue(token).trim() || fallback

/** The app theme (`--canvas`, `--text`, `--accent`…) as Mermaid colors. */
export function readThemeVariables(
  root: HTMLElement = document.documentElement
): MermaidThemeVariables {
  const styles = getComputedStyle(root)
  const theme = root.dataset.theme === 'light' ? 'light' : 'dark'
  const canvas = read(styles, '--canvas', theme === 'light' ? '#FFFFFF' : '#111318')
  const surface = read(styles, '--surface', theme === 'light' ? '#FFFFFF' : '#161922')
  const surface2 = read(styles, '--surface2', theme === 'light' ? '#F8FAFC' : '#12151d')
  const border = read(styles, '--border', theme === 'light' ? '#E2E8F0' : '#1e2130')
  const text = read(styles, '--text', theme === 'light' ? '#0F172A' : '#E2E8F0')
  const text2 = read(styles, '--text2', theme === 'light' ? '#64748B' : '#8892A4')
  const text3 = read(styles, '--text3', theme === 'light' ? '#94A3B8' : '#5b6478')
  const accent = read(styles, '--accent', theme === 'light' ? '#2563EB' : '#4F8EF7')

  return {
    darkMode: theme === 'dark',
    background: canvas,
    fontFamily: read(styles, '--font-sans', 'sans-serif'),
    fontSize: '13px',
    primaryColor: surface,
    primaryTextColor: text,
    primaryBorderColor: accent,
    secondaryColor: surface2,
    secondaryTextColor: text,
    secondaryBorderColor: border,
    tertiaryColor: canvas,
    tertiaryTextColor: text2,
    tertiaryBorderColor: border,
    lineColor: text3,
    textColor: text,
    mainBkg: surface,
    nodeBorder: accent,
    clusterBkg: surface2,
    clusterBorder: border,
    titleColor: text,
    edgeLabelBackground: canvas,
    // Sequence diagrams
    actorBkg: surface,
    actorBorder: accent,
    actorTextColor: text,
    actorLineColor: text3,
    signalColor: text2,
    signalTextColor: text,
    labelBoxBkgColor: surface2,
    labelBoxBorderColor: border,
    labelTextColor: text,
    loopTextColor: text2,
    noteBkgColor: surface2,
    noteBorderColor: border,
    noteTextColor: text,
    activationBkgColor: surface2,
    activationBorderColor: accent,
    sequenceNumberColor: canvas
  }
}
