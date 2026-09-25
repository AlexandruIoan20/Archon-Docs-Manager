/** The files a diagram exports to (plan 19). */
export type ExportExtension = 'png' | 'svg' | 'pdf' | 'xmi'

export interface ExportSaveRequest {
  /** File name without extension, e.g. the diagram title. */
  defaultName: string
  extension: Exclude<ExportExtension, 'pdf'>
  /** Bytes for PNG, text for SVG and XMI. */
  data: Uint8Array | string
}

export interface ExportPdfRequest {
  defaultName: string
  /** A standalone SVG document; the PDF has one page of its size. */
  svg: string
  /** Size of the SVG in CSS pixels. */
  width: number
  height: number
}

/** Main picks the path in the native save dialog; the renderer never does. */
export type ExportSaveResult = { path: string } | { canceled: true }
