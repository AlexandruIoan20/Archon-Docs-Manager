import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { PanelLayout, PanelMode } from '@/core/types'
import { useUiStore } from '@/store'
import { AppShell } from '../AppShell'
import { InspectorPanel } from '../InspectorPanel'
import { Sidebar } from '../Sidebar'

const initialState = useUiStore.getState()

function layoutWith(sidebar: PanelMode, inspector: PanelMode): PanelLayout {
  return {
    sidebar: { mode: sidebar, width: 260, fits: sidebar === 'docked' },
    inspector: { mode: inspector, width: 240, fits: inspector === 'docked' }
  }
}

function renderShell(layout: PanelLayout): void {
  render(
    <AppShell
      layout={layout}
      titleBar={<div>title bar</div>}
      tabBar={<div>tab bar</div>}
      sidebar={<Sidebar panel={layout.sidebar}>tree</Sidebar>}
      main={<p>editor area</p>}
      inspector={<InspectorPanel panel={layout.inspector}>props</InspectorPanel>}
      statusBar={<div>status bar</div>}
    />
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
  })

  it('renders every slot', () => {
    renderShell(layoutWith('docked', 'docked'))
    for (const text of ['title bar', 'tab bar', 'tree', 'editor area', 'props', 'status bar']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.getByRole('main')).toHaveTextContent('editor area')
  })

  it('sizes the grid columns from the docked panels', () => {
    renderShell(layoutWith('docked', 'docked'))
    const shell = screen.getByTestId('app-shell')
    expect(shell.style.getPropertyValue('--size-sidebar')).toBe('260px')
    expect(shell.style.getPropertyValue('--size-inspector')).toBe('240px')
  })

  it('leaves the inspector out when it is not visible', () => {
    renderShell(layoutWith('docked', 'hidden'))
    expect(screen.queryByRole('complementary', { name: 'Inspector' })).not.toBeInTheDocument()
    expect(screen.queryByText('props')).not.toBeInTheDocument()
    expect(screen.getByTestId('app-shell').style.getPropertyValue('--size-inspector')).toBe('0px')
  })

  it('gives a zero column to a panel shown as a drawer', () => {
    renderShell(layoutWith('overlay', 'hidden'))
    const drawer = screen.getByRole('complementary', { name: 'Sidebar' })
    expect(drawer).toHaveAttribute('data-mode', 'overlay')
    expect(screen.getByTestId('app-shell').style.getPropertyValue('--size-sidebar')).toBe('0px')
    // Drawers cannot be resized.
    expect(within(drawer).queryByRole('separator')).not.toBeInTheDocument()
  })

  it('gives docked panels a resize handle', () => {
    renderShell(layoutWith('docked', 'docked'))
    expect(screen.getByRole('separator', { name: 'Resize sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('separator', { name: 'Resize inspector' })).toBeInTheDocument()
  })

  it('hides the inspector from its close button', () => {
    renderShell(layoutWith('docked', 'docked'))
    screen.getByRole('button', { name: 'Close properties' }).click()
    expect(useUiStore.getState().panels.inspector.visible).toBe(false)
  })
})
