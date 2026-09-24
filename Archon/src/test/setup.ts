import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// jsdom has no layout: ProseMirror measures ranges when it scrolls the
// selection into view (TipTap editor tests).
if (typeof Range !== 'undefined' && !('getClientRects' in Range.prototype)) {
  const emptyRect = (): DOMRect =>
    ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) as DOMRect
  Object.assign(Range.prototype, {
    getClientRects: () => Object.assign([], { item: () => null }) as unknown as DOMRectList,
    getBoundingClientRect: emptyRect
  })
}
