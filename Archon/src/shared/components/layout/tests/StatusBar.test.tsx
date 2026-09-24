import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useStatusStore, useUiStore } from '@/store'
import { ShellStatusBar } from '../ShellStatusBar'
import { StatusBar } from '../StatusBar'
import { StatusPath } from '../StatusPath'
import { StatusSegment } from '../StatusSegment'

const initialUi = useUiStore.getState()
const initialStatus = useStatusStore.getState()
const LONG_PATH = 'Playbooks/Phishing/Enrichment/Deep/Nested/incident-triage.soardiag'

/** Reports a fixed width for every observed element. */
function stubResizeObserver(width: number): void {
  class FixedResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element): void {
      const entry = { target, borderBoxSize: [{ inlineSize: width, blockSize: 16 }] }
      this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve(): void {
      // Nothing to release.
    }
    disconnect(): void {
      // Nothing to release.
    }
  }
  vi.stubGlobal('ResizeObserver', FixedResizeObserver)
}

describe('StatusSegment', () => {
  it('exposes its priority for the container rules', () => {
    render(
      <StatusBar
        right={
          <>
            <StatusSegment priority={1}>6 nodes</StatusSegment>
            <StatusSegment priority={3}>DARK</StatusSegment>
            <StatusSegment>87%</StatusSegment>
          </>
        }
      />
    )
    expect(screen.getByText('6 nodes')).toHaveAttribute('data-priority', '1')
    expect(screen.getByText('DARK')).toHaveAttribute('data-priority', '3')
    expect(screen.getByText('87%')).not.toHaveAttribute('data-priority')
  })

  it('renders the dot before the text', () => {
    render(<StatusSegment dot="success">Ready</StatusSegment>)
    const segment = screen.getByText('Ready')
    expect(segment.firstElementChild).toHaveClass('bg-success')
  })
})

describe('StatusPath', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('says so when no file is open', () => {
    render(<StatusPath />)
    expect(screen.getByText('No file open')).toBeInTheDocument()
  })

  it('shortens a long path in the middle and keeps the full path in a tooltip', async () => {
    stubResizeObserver(300) // 45 mono characters at 11px
    render(<StatusPath path={LONG_PATH} />)

    const path = screen.getByTestId('status-path')
    await vi.waitFor(() =>
      expect(path).toHaveTextContent('Playbooks/…/Nested/incident-triage.soardiag')
    )
    expect(path.parentElement).toHaveAttribute('title', LONG_PATH)
  })

  it('shows a short path as is', () => {
    render(<StatusPath path="Docs/overview.soardoc" />)
    expect(screen.getByTestId('status-path')).toHaveTextContent('Docs/overview.soardoc')
  })
})

describe('ShellStatusBar', () => {
  beforeEach(() => {
    useUiStore.setState(initialUi, true)
    useStatusStore.setState(initialStatus, true)
  })

  it('shows the state, the empty path and the theme label', () => {
    render(<ShellStatusBar />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('No file open')).toBeInTheDocument()
    expect(screen.getByText('DARK')).toHaveAttribute('data-priority', '3')
  })

  it('follows the theme and the status store', () => {
    render(<ShellStatusBar editorItems={<StatusSegment priority={1}>74 words</StatusSegment>} />)
    act(() => {
      useUiStore.getState().setResolvedTheme('light')
      useStatusStore.getState().setStatus('Connecting…')
    })
    expect(screen.getByText('LIGHT')).toBeInTheDocument()
    expect(screen.getByText('Connecting…').parentElement?.firstElementChild).toHaveClass(
      'bg-accent'
    )
    expect(screen.getByText('74 words')).toBeInTheDocument()
  })
})
