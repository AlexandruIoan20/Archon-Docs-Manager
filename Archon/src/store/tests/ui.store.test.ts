import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '../ui.store'

const initialState = useUiStore.getState()
const panels = (): ReturnType<typeof useUiStore.getState>['panels'] => useUiStore.getState().panels

describe('ui.store', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
  })

  it('starts with both panels visible at their default widths', () => {
    expect(panels().sidebar).toEqual({ visible: true, width: 260, overlayOpen: false })
    expect(panels().inspector).toEqual({ visible: true, width: 240, overlayOpen: false })
  })

  it('toggles visibility when the panel has room', () => {
    useUiStore.getState().togglePanel('inspector', false)
    expect(panels().inspector.visible).toBe(false)
    useUiStore.getState().togglePanel('inspector', false)
    expect(panels().inspector.visible).toBe(true)
  })

  it('toggles only the drawer when space hid the panel', () => {
    const { togglePanel } = useUiStore.getState()
    togglePanel('inspector', true)
    expect(panels().inspector).toMatchObject({ visible: true, overlayOpen: true })
    expect(useUiStore.getState().lastOverlay).toBe('inspector')

    togglePanel('inspector', true)
    expect(panels().inspector).toMatchObject({ visible: true, overlayOpen: false })
  })

  it('opens a drawer for a panel the user had closed', () => {
    const { togglePanel } = useUiStore.getState()
    togglePanel('sidebar', false)
    togglePanel('sidebar', true)
    expect(panels().sidebar).toMatchObject({ visible: true, overlayOpen: true })
  })

  it('keeps drawers mutually exclusive', () => {
    const { togglePanel } = useUiStore.getState()
    togglePanel('sidebar', true)
    togglePanel('inspector', true)
    expect(panels().sidebar.overlayOpen).toBe(false)
    expect(panels().inspector.overlayOpen).toBe(true)
    expect(useUiStore.getState().lastOverlay).toBe('inspector')
  })

  it('clamps panel widths to their limits', () => {
    const { setPanelWidth } = useUiStore.getState()
    setPanelWidth('sidebar', 1000)
    expect(panels().sidebar.width).toBe(420)
    setPanelWidth('sidebar', 10)
    expect(panels().sidebar.width).toBe(200)
    setPanelWidth('inspector', 100)
    expect(panels().inspector.width).toBe(220)
    setPanelWidth('inspector', 300.6)
    expect(panels().inspector.width).toBe(301)
  })

  it('resets a width to its default', () => {
    const { setPanelWidth, resetPanelWidth } = useUiStore.getState()
    setPanelWidth('inspector', 380)
    resetPanelWidth('inspector')
    expect(panels().inspector.width).toBe(240)
  })

  it('closes drawers without touching visibility', () => {
    const { togglePanel, closeOverlays, closeOverlay } = useUiStore.getState()
    togglePanel('sidebar', true)
    closeOverlays()
    expect(panels().sidebar).toMatchObject({ visible: true, overlayOpen: false })

    togglePanel('inspector', true)
    closeOverlay('inspector')
    expect(panels().inspector).toMatchObject({ visible: true, overlayOpen: false })
  })

  it('opens and closes modals', () => {
    const { openModal, closeModal } = useUiStore.getState()
    openModal('new-diagram')
    expect(useUiStore.getState().activeModal).toBe('new-diagram')
    closeModal()
    expect(useUiStore.getState().activeModal).toBeNull()
  })
})
