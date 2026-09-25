import { describe, expect, it } from 'vitest'
import { getNodeSkin } from '../node-skin'

const BLUE = '#2563EB'

describe('getNodeSkin', () => {
  it('card: tinted border and icon background', () => {
    expect(getNodeSkin('card', BLUE)).toEqual({
      className: 'ar-node ar-node--card',
      style: {
        '--node-color': BLUE,
        '--node-contour': 'rgba(37, 99, 235, 0.55)',
        '--node-border': 'rgba(37, 99, 235, 0.45)',
        '--node-tint': 'rgba(37, 99, 235, 0.16)'
      }
    })
  })

  it('outline: full-color border, no icon background', () => {
    expect(getNodeSkin('outline', BLUE).style).toMatchObject({
      '--node-border': BLUE,
      '--node-tint': 'transparent'
    })
  })

  it('solid: white icon tint on the node color', () => {
    const skin = getNodeSkin('solid', BLUE)
    expect(skin.className).toBe('ar-node ar-node--solid')
    expect(skin.style).toMatchObject({
      '--node-border': BLUE,
      '--node-tint': 'rgba(255, 255, 255, 0.22)'
    })
  })

  it('marks the pending connect source', () => {
    expect(getNodeSkin('outline', BLUE, { pending: true }).className).toBe(
      'ar-node ar-node--outline ar-node--pending'
    )
  })
})
