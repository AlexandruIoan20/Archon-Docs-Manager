import { BrowserWindow } from 'electron'
import { promises as fsp } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { AppError } from '../errors'

/** Largest page side, in CSS px (a PDF page tops out at 200 inches). */
const MAX_SIDE = 19_200

/** The page that holds the SVG: exactly its size, no margins. */
export function pdfPageHtml(svg: string, width: number, height: number): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">
<style>
@page { size: ${width}px ${height}px; margin: 0 }
html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden }
body > svg { display: block; width: ${width}px; height: ${height}px }
</style>
</head>
<body>${svg}</body>
</html>`
}

export function assertPageSize(width: unknown, height: unknown): void {
  const valid = (n: unknown): n is number =>
    typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= MAX_SIDE
  if (!valid(width) || !valid(height)) {
    throw new AppError('INVALID_ARGUMENT', 'The diagram is too large (or empty) for a PDF page')
  }
}

/**
 * Prints the SVG to a one-page PDF, text kept as text. The page is loaded in a
 * hidden, sandboxed window without preload or scripts, which is closed after.
 */
export async function svgToPdf(svg: string, width: number, height: number): Promise<Buffer> {
  if (typeof svg !== 'string' || !svg.includes('<svg')) {
    throw new AppError('INVALID_ARGUMENT', 'Expected an SVG document')
  }
  assertPageSize(width, height)
  const w = Math.ceil(width)
  const h = Math.ceil(height)

  // A file, not a data: URL: large diagrams exceed the URL length limit.
  const file = join(tmpdir(), `soar-export-${randomUUID()}.html`)
  await fsp.writeFile(file, pdfPageHtml(svg, w, h), 'utf8')
  const window = new BrowserWindow({
    show: false,
    width: Math.min(w, 4000),
    height: Math.min(h, 4000),
    webPreferences: { sandbox: true, contextIsolation: true, javascript: false }
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  try {
    await window.loadFile(file)
    return await window.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })
  } finally {
    window.destroy()
    await fsp.rm(file, { force: true })
  }
}
