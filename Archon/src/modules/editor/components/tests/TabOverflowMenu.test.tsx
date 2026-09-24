import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '@/store'
import { EditorTabs } from '../EditorTabs'

const initialEditor = useEditorStore.getState()

/** jsdom has no layout: fake a strip that is wider than its box. */
function fakeOverflow(scrollLeft = 0): void {
  const list = screen.getByRole('tablist')
  Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 2000 })
  Object.defineProperty(list, 'clientWidth', { configurable: true, value: 600 })
  list.scrollLeft = scrollLeft
  fireEvent.scroll(list)
}

describe('tab overflow', () => {
  beforeEach(() => {
    useEditorStore.setState(initialEditor, true)
    for (let i = 1; i <= 20; i++) useEditorStore.getState().openFile(`doc-${i}.soardoc`, 'soardoc')
  })

  it('shows fades and a menu with every tab once the strip overflows', () => {
    render(<EditorTabs onNew={() => undefined} />)
    expect(screen.queryByRole('button', { name: 'All tabs' })).toBeNull()

    fakeOverflow()
    expect(screen.queryByTestId('fade-start')).toBeNull()
    expect(screen.getByTestId('fade-end')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All tabs' }))
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(20)
    fireEvent.click(screen.getByRole('menuitem', { name: 'doc-3' }))
    expect(screen.getByRole('tab', { name: /doc-3/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the start fade once scrolled', () => {
    render(<EditorTabs onNew={() => undefined} />)
    fakeOverflow(400)
    expect(screen.getByTestId('fade-start')).toBeInTheDocument()
    expect(screen.getByTestId('fade-end')).toBeInTheDocument()
  })
})
