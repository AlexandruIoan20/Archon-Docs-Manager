import type { MermaidState, SetState } from './diagram-state'

export const SPLIT_RATIO = { min: 20, max: 80, default: 40 } as const

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** The Mermaid editor's slice of the tab's store. */
export function createMermaidSlice(set: SetState): MermaidState {
  return {
    splitRatio: SPLIT_RATIO.default,
    previewZoom: 1,
    setMermaidSource: (source) =>
      set((state) =>
        state.meta.mermaidSource === source
          ? state
          : { meta: { ...state.meta, mermaidSource: source }, revision: state.revision + 1 }
      ),
    setSplitRatio: (ratio) => set({ splitRatio: clamp(ratio, SPLIT_RATIO.min, SPLIT_RATIO.max) }),
    setPreviewZoom: (previewZoom) => set({ previewZoom })
  }
}
