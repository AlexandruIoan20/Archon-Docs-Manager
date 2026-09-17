import { create } from 'zustand'
import type { ModalId, PanelId, PanelPreference } from '@/core/types'
import {
  INSPECTOR_WIDTH,
  SIDEBAR_WIDTH,
  type PanelWidthLimits
} from '@/core/constants/layout.constants'

export const PANEL_WIDTH_LIMITS: Record<PanelId, PanelWidthLimits> = {
  sidebar: SIDEBAR_WIDTH,
  inspector: INSPECTOR_WIDTH
}

const OTHER_PANEL: Record<PanelId, PanelId> = { sidebar: 'inspector', inspector: 'sidebar' }

export function clampPanelWidth(id: PanelId, width: number): number {
  const { min, max } = PANEL_WIDTH_LIMITS[id]
  return Math.round(Math.min(Math.max(width, min), max))
}

export interface UiState {
  panels: Record<PanelId, PanelPreference>
  /** The drawer opened most recently; wins if both ask for an overlay. */
  lastOverlay: PanelId | null
  /** True while a panel edge is dragged (persistence waits for the drop). */
  panelResizing: boolean
  activeModal: ModalId | null

  /**
   * Shows or hides a panel. When space keeps the panel from docking
   * (`autoHidden`), only the drawer toggles and the saved preference stays.
   */
  togglePanel: (id: PanelId, autoHidden: boolean) => void
  setPanelWidth: (id: PanelId, width: number) => void
  resetPanelWidth: (id: PanelId) => void
  setPanelResizing: (resizing: boolean) => void
  closeOverlay: (id: PanelId) => void
  closeOverlays: () => void
  openModal: (id: ModalId) => void
  closeModal: () => void
}

const initialPanel = (id: PanelId): PanelPreference => ({
  visible: true,
  width: PANEL_WIDTH_LIMITS[id].default,
  overlayOpen: false
})

export const useUiStore = create<UiState>()((set) => ({
  panels: { sidebar: initialPanel('sidebar'), inspector: initialPanel('inspector') },
  lastOverlay: null,
  panelResizing: false,
  activeModal: null,

  togglePanel: (id, autoHidden) =>
    set((state) => {
      const panel = state.panels[id]
      if (!autoHidden) {
        return {
          panels: {
            ...state.panels,
            [id]: { ...panel, visible: !panel.visible, overlayOpen: false }
          }
        }
      }
      if (panel.visible && panel.overlayOpen) {
        return { panels: { ...state.panels, [id]: { ...panel, overlayOpen: false } } }
      }
      // Opening a drawer: it also becomes visible (so it docks once there is
      // room) and closes the other drawer.
      const other = OTHER_PANEL[id]
      const panels = { ...state.panels }
      panels[id] = { ...panel, visible: true, overlayOpen: true }
      panels[other] = { ...panels[other], overlayOpen: false }
      return { lastOverlay: id, panels }
    }),

  setPanelWidth: (id, width) =>
    set((state) => {
      const next = clampPanelWidth(id, width)
      if (state.panels[id].width === next) return state
      return { panels: { ...state.panels, [id]: { ...state.panels[id], width: next } } }
    }),

  resetPanelWidth: (id) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [id]: { ...state.panels[id], width: PANEL_WIDTH_LIMITS[id].default }
      }
    })),

  setPanelResizing: (panelResizing) => set({ panelResizing }),

  closeOverlay: (id) =>
    set((state) =>
      state.panels[id].overlayOpen
        ? { panels: { ...state.panels, [id]: { ...state.panels[id], overlayOpen: false } } }
        : state
    ),

  closeOverlays: () =>
    set((state) => {
      const { sidebar, inspector } = state.panels
      if (!sidebar.overlayOpen && !inspector.overlayOpen) return state
      return {
        panels: {
          sidebar: { ...sidebar, overlayOpen: false },
          inspector: { ...inspector, overlayOpen: false }
        }
      }
    }),

  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null })
}))
