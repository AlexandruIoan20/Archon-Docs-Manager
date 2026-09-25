import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AppPlatform } from '@/core/types'
import { APP_NAME } from '@/core/constants/app.constants'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { TitleBar, type TitleBarProps } from '../TitleBar'
import { useTitleBarDensity } from '../title-bar/TitleBarDensityContext'

function withQueryClient(ui: ReactNode): React.JSX.Element {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>
}

function renderBar(props: TitleBarProps = {}, platform?: AppPlatform): ArchonApiMock | undefined {
  const mock = platform ? createArchonApiMock({ platform }) : undefined
  if (mock) window.archon = mock.api
  render(withQueryClient(<TitleBar {...props} />))
  return mock
}

function DensityProbe(): React.JSX.Element {
  return <span data-testid="density">{useTitleBarDensity()}</span>
}

/** A ResizeObserver that reports one fixed width for every observed element. */
function stubResizeObserver(width: number): void {
  class FixedResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element): void {
      const entry = { target, borderBoxSize: [{ inlineSize: width, blockSize: 48 }] }
      this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve(): void {
      // Nothing to release: the width is reported once, on observe.
    }
    disconnect(): void {
      // Nothing to release: the width is reported once, on observe.
    }
  }
  vi.stubGlobal('ResizeObserver', FixedResizeObserver)
}

describe('TitleBar', () => {
  afterEach(() => {
    delete window.archon
    vi.unstubAllGlobals()
  })

  it('renders the toolbar and actions slots', () => {
    renderBar({ toolbar: <button>Select</button>, actions: <button>Export</button> })
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(screen.getByText(APP_NAME)).toBeInTheDocument()
  })

  it('hides separators next to empty groups', () => {
    renderBar({ toolbar: null })
    expect(screen.queryAllByRole('separator')).toHaveLength(0)
  })

  it('shows separators only between groups with content', () => {
    renderBar({
      toolbar: <button>Select</button>,
      actions: <button>Export</button>,
      theme: 'dark',
      onToggleTheme: () => {}
    })
    expect(screen.getAllByRole('separator')).toHaveLength(2)
  })

  it('shows the theme toggle and reports clicks', () => {
    const onToggleTheme = vi.fn()
    renderBar({ theme: 'dark', onToggleTheme })
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(onToggleTheme).toHaveBeenCalledOnce()
  })

  it('draws window controls only on Linux', async () => {
    renderBar({}, 'linux')
    expect(await screen.findByRole('group', { name: 'Window controls' })).toBeInTheDocument()
  })

  it('leaves window controls to the OS on Windows and macOS', async () => {
    const mock = renderBar({}, 'win32')
    await act(async () => {})
    expect(mock?.api.app.getInfo).toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Window controls' })).not.toBeInTheDocument()
  })

  it('toggles maximize on double-click of the empty bar on Linux', async () => {
    const mock = renderBar({ toolbar: <button>Select</button> }, 'linux')
    await screen.findByRole('group', { name: 'Window controls' })

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Select' }))
    expect(mock?.api.window.toggleMaximize).not.toHaveBeenCalled()

    fireEvent.doubleClick(screen.getByRole('banner'))
    expect(mock?.api.window.toggleMaximize).toHaveBeenCalledOnce()
  })

  it('switches to the minimal layout on a narrow bar', async () => {
    stubResizeObserver(640)
    renderBar({ toolbar: <DensityProbe /> })

    expect(await screen.findByText('minimal')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveAttribute('data-density', 'minimal')
    expect(screen.queryByText(APP_NAME)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: APP_NAME })).toBeInTheDocument()
  })

  it('provides the compact density to contributed tools', async () => {
    stubResizeObserver(850)
    renderBar({ toolbar: <DensityProbe /> })
    expect(await screen.findByText('compact')).toBeInTheDocument()
  })
})
