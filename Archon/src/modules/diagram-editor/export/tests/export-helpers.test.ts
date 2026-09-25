import { describe, expect, it } from 'vitest'
import { EXPORT_PADDING, exportFrame, keepInExport } from '../export-canvas'
import { svgFromDataUrl } from '../export-image'
import { standaloneSvg, svgSize } from '../export-mermaid'

const element = (className: string): HTMLElement => {
  const el = document.createElement('div')
  el.className = className
  return el
}

describe('canvas export', () => {
  it('frames the nodes with the padding, at 100%', () => {
    expect(exportFrame({ x: 100, y: -40, width: 400, height: 200 })).toEqual({
      width: 400 + EXPORT_PADDING * 2,
      height: 200 + EXPORT_PADDING * 2,
      transform: `translate(${EXPORT_PADDING - 100}px, ${EXPORT_PADDING + 40}px) scale(1)`
    })
  })

  it('leaves handles, resize grips and selection chrome out', () => {
    expect(keepInExport(element('react-flow__handle soar-handle'))).toBe(false)
    expect(keepInExport(element('soar-node-ring'))).toBe(false)
    expect(keepInExport(element('soar-node-toolbar nodrag'))).toBe(false)
    expect(keepInExport(element('react-flow__node'))).toBe(true)
  })

  it('reads the SVG out of a data URL', () => {
    expect(svgFromDataUrl('data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E')).toBe(
      '<svg></svg>'
    )
    expect(svgFromDataUrl(`data:image/svg+xml;base64,${btoa('<svg/>')}`)).toBe('<svg/>')
  })
})

describe('Mermaid export', () => {
  it('sizes the SVG from its viewBox', () => {
    expect(svgSize('<svg viewBox="-8 -8 320.5 180" width="100%"></svg>')).toEqual({
      width: 321,
      height: 180
    })
    expect(svgSize('<svg width="40" height="20"></svg>')).toEqual({ width: 40, height: 20 })
  })

  it('gives the file real dimensions and the canvas background', () => {
    const { svg, width, height } = standaloneSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="100%" style="max-width: 300px"><g/></svg>',
      '#111318'
    )
    expect([width, height]).toEqual([300, 100])
    expect(svg).toContain('width="300"')
    expect(svg).toContain('height="100"')
    expect(svg).toContain('background-color: #111318')
    expect(svg).not.toContain('max-width')
  })
})
