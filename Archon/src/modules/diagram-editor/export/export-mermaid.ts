import { renderMermaid } from '../mermaid/mermaid-loader'
import { readThemeVariables } from '../mermaid/theme-variables'
import { canvasBackground, type ExportImage } from './export-image'
import { PNG_PIXEL_RATIO } from './export-canvas'

/** The width and height an SVG declares (its `viewBox`, else its attributes). */
export function svgSize(svg: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const box = root
    .getAttribute('viewBox')
    ?.split(/[\s,]+/)
    .map(Number)
  if (box && box.length === 4 && box[2]! > 0 && box[3]! > 0) {
    return { width: Math.ceil(box[2]!), height: Math.ceil(box[3]!) }
  }
  const width = Number.parseFloat(root.getAttribute('width') ?? '')
  const height = Number.parseFloat(root.getAttribute('height') ?? '')
  if (width > 0 && height > 0) return { width: Math.ceil(width), height: Math.ceil(height) }
  throw new Error('The diagram has no size')
}

/**
 * A standalone SVG of its own size, on the canvas color. Mermaid sizes its SVG
 * to the page (`width="100%"`, `max-width`); a file needs real dimensions.
 */
export function standaloneSvg(svg: string, background: string): ExportImage {
  const { width, height } = svgSize(svg)
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  root.setAttribute('width', String(width))
  root.setAttribute('height', String(height))
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  root.removeAttribute('style')
  root.setAttribute('style', `background-color: ${background}`)
  return { svg: new XMLSerializer().serializeToString(root), width, height }
}

/** Renders the source again for the file: same theme, labels as SVG text. */
export async function mermaidToSvg(source: string): Promise<ExportImage> {
  const result = await renderMermaid(source, readThemeVariables(), { htmlLabels: false })
  if ('error' in result) {
    const where = result.error.line === null ? '' : ` (line ${result.error.line})`
    throw new Error(`The Mermaid source has an error${where}`)
  }
  return standaloneSvg(result.svg, canvasBackground())
}

/** Draws the SVG on a canvas at 2× and encodes it as PNG. */
export async function svgToPng({ svg, width, height }: ExportImage): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * PNG_PIXEL_RATIO)
    canvas.height = Math.ceil(height * PNG_PIXEL_RATIO)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not draw the PNG')
    context.scale(PNG_PIXEL_RATIO, PNG_PIXEL_RATIO)
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not encode the PNG')
    return new Uint8Array(await blob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(url)
  }
}
