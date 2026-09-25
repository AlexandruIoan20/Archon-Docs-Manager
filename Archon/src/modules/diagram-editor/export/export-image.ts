/** What an export produced, before main saves it. */
export interface ExportImage {
  /** A standalone SVG document (also what the PDF prints). */
  svg: string
  width: number
  height: number
}

/** `data:image/svg+xml;charset=utf-8,…` (html-to-image) → the SVG text. */
export function svgFromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(',')
  const head = dataUrl.slice(0, comma)
  const body = dataUrl.slice(comma + 1)
  return head.endsWith(';base64') ? atob(body) : decodeURIComponent(body)
}

export function bytesFromDataUrl(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** The theme's canvas color at the moment of the export. */
export function canvasBackground(root: HTMLElement = document.documentElement): string {
  return getComputedStyle(root).getPropertyValue('--canvas').trim() || '#111318'
}
