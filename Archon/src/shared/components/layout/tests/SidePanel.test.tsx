import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { PanelId } from '@/core/types'
import { useUiStore } from '@/store'
import { usePanelLayout } from '@/shared/hooks/usePanelLayout'
import { AppShell } from '../AppShell'
import { InspectorPanel } from '../InspectorPanel'
import { Sidebar } from '../Sidebar'
import { SidePanel } from '../SidePanel'

const initialState = useUiStore.getState()

function Shell(): React.JSX.Element {
  const layout = usePanelLayout()
  const closeOverlays = useUiStore((s) => s.closeOverlays)
  return (
    <AppShell
      layout={layout}
      onMainPointerDown={closeOverlays}
      titleBar={<button>outside</button>}
      sidebar={<Sidebar panel={layout.sidebar}>tree</Sidebar>}
      main={<p>editor area</p>}
      inspector={<InspectorPanel panel={layout.inspector}>props</InspectorPanel>}
    />
  )
}

function setWindowWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

function openDrawer(id: PanelId): void {
  act(() => useUiStore.getState().togglePanel(id, true))
}

describe('SidePanel in overlay mode', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
    setWindowWidth(1000) // sidebar docked, inspector hidden by space
  })

  it('opens the inspector as a drawer when it does not fit', () => {
    render(<Shell />)
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'outside' }))
    openDrawer('inspector')

    const drawer = screen.getByRole('complementary', { name: 'Inspector' })
    expect(drawer).toHaveAttribute('data-mode', 'overlay')
    expect(drawer).toHaveFocus()
  })

  it('closes on Escape and gives focus back', () => {
    render(<Shell />)
    const trigger = screen.getByRole('button', { name: 'outside' })
    trigger.focus()
    openDrawer('inspector')
    expect(screen.getByRole('complementary', { name: 'Inspector' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(useUiStore.getState().panels.inspector.visible).toBe(true)
  })

  it('closes on a pointer down in the main area', () => {
    render(<Shell />)
    openDrawer('inspector')
    fireEvent.pointerDown(screen.getByText('editor area'))
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument()
  })

  it('shows one drawer at a time on a narrow window', () => {
    setWindowWidth(720)
    render(<Shell />)
    openDrawer('sidebar')
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()

    openDrawer('inspector')
    expect(screen.queryByRole('complementary', { name: 'Sidebar' })).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Inspector' })).toBeInTheDocument()
  })

  it('does not react to Escape when docked', () => {
    let closed = 0
    render(
      <SidePanel mode="docked" width={260} side="start" label="Sidebar" onClose={() => closed++}>
        tree
      </SidePanel>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(0)
  })
})
