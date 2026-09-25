import { getNodesBounds, type Rect } from '@xyflow/react'
import { toPng, toSvg } from 'html-to-image'
import type { FlowNode } from '../utils/graph-mapping'
import {
  bytesFromDataUrl,
  canvasBackground,
  svgFromDataUrl,
  type ExportImage
} from './export-image'

export const EXPORT_PADDING = 24
export const PNG_PIXEL_RATIO = 2

/** Editing UI inside the viewport, left out of the image. */
const EXCLUDED_CLASSES = [
  'react-flow__handle',
  'react-flow__resize-control',
  'react-flow__nodesselection',
  'ar-node-ring',
  'ar-node-grip',
  'ar-node-toolbar'
]

export function keepInExport(node: HTMLElement): boolean {
  const classes = node.classList
  if (!classes) return true
  return !EXCLUDED_CLASSES.some((name) => classes.contains(name))
}

/** The image frame: the nodes' bounds plus the padding, at 100%. */
export function exportFrame(bounds: Rect): {
  width: number
  height: number
  transform: string
} {
  const width = Math.ceil(bounds.width + EXPORT_PADDING * 2)
  const height = Math.ceil(bounds.height + EXPORT_PADDING * 2)
  const x = EXPORT_PADDING - bounds.x
  const y = EXPORT_PADDING - bounds.y
  return { width, height, transform: `translate(${x}px, ${y}px) scale(1)` }
}

/** The `.react-flow__viewport` of the tab's canvas. */
export function findViewport(tabId: string): HTMLElement {
  const viewport = document.querySelector<HTMLElement>(
    `[data-diagram-tab="${CSS.escape(tabId)}"] .react-flow__viewport`
  )
  if (!viewport) throw new Error('The diagram is not on screen')
  return viewport
}

type HtmlToImageOptions = NonNullable<Parameters<typeof toSvg>[1]>

function frameOptions(nodes: readonly FlowNode[]): {
  width: number
  height: number
  options: HtmlToImageOptions
} {
  if (nodes.length === 0) throw new Error('The diagram is empty')
  const { width, height, transform } = exportFrame(getNodesBounds([...nodes]))
  return {
    width,
    height,
    options: {
      width,
      height,
      backgroundColor: canvasBackground(),
      filter: keepInExport,
      // The clone is framed on the nodes; the canvas on screen does not move.
      style: { width: `${width}px`, height: `${height}px`, transform }
    }
  }
}

/** The whole diagram as SVG, whatever part of it is on screen. */
export async function canvasToSvg(tabId: string, nodes: readonly FlowNode[]): Promise<ExportImage> {
  const { width, height, options } = frameOptions(nodes)
  const svg = svgFromDataUrl(await toSvg(findViewport(tabId), options))
  return { svg, width, height }
}

export async function canvasToPng(tabId: string, nodes: readonly FlowNode[]): Promise<Uint8Array> {
  const { options } = frameOptions(nodes)
  return bytesFromDataUrl(
    await toPng(findViewport(tabId), { ...options, pixelRatio: PNG_PIXEL_RATIO })
  )
}
