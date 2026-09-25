import { create } from 'zustand'
import type { FileKind, SearchResult } from '@/core/types'
import { useUiStore } from './ui.store'

export interface SearchPaletteRequest {
  /** Only results of this kind (e.g. „Link diagram”: `.ardiag` files). */
  kind?: FileKind
  placeholder?: string
  /** Replaces opening the result. */
  onPick?: (result: SearchResult) => void
}

/** How the palette was opened; plain Ctrl/Cmd+K is `{}`. */
export const useSearchPaletteStore = create<{ request: SearchPaletteRequest }>()(() => ({
  request: {}
}))

/** Opens the command palette, optionally filtered and with its own action. */
export function openSearchPalette(request: SearchPaletteRequest = {}): void {
  useSearchPaletteStore.setState({ request })
  useUiStore.getState().openModal('command-palette')
}
