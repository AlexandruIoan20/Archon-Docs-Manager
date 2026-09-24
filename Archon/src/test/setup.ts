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

// React Flow measures its container and nodes; jsdom has neither observer nor
// matrix. These stand-ins never fire, so sizes stay 0 as without them.
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {
      // Never reports a size.
    }
    unobserve(): void {
      // Nothing to stop.
    }
    disconnect(): void {
      // Nothing to stop.
    }
  }
}
if (typeof DOMMatrixReadOnly === 'undefined') {
  globalThis.DOMMatrixReadOnly = class {
    m22 = 1
    constructor(transform?: string) {
      const scale = transform?.match(/scale\(([\d.]+)\)/)?.[1]
      this.m22 = scale ? Number(scale) : 1
    }
  } as unknown as typeof DOMMatrixReadOnly
}
