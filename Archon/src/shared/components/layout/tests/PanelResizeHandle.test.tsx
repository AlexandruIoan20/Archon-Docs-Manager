import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PanelResizeHandle, type PanelResizeHandleProps } from '../PanelResizeHandle'

type HarnessProps = Partial<Pick<PanelResizeHandleProps, 'edge' | 'onDragChange'>> & {
  initial?: number
}

function Harness({ initial = 260, edge = 'end', onDragChange }: HarnessProps): React.JSX.Element {
  const [width, setWidth] = useState(initial)
  return (
    <PanelResizeHandle
      value={width}
      min={200}
      max={420}
      onChange={setWidth}
      onReset={() => setWidth(260)}
      onDragChange={onDragChange}
      edge={edge}
      label="Resize sidebar"
    />
  )
}

const handle = (): HTMLElement => screen.getByRole('separator', { name: 'Resize sidebar' })

describe('PanelResizeHandle', () => {
  it('exposes separator semantics', () => {
    render(<Harness />)
    expect(handle()).toHaveAttribute('aria-orientation', 'vertical')
    expect(handle()).toHaveAttribute('aria-valuenow', '260')
    expect(handle()).toHaveAttribute('aria-valuemin', '200')
    expect(handle()).toHaveAttribute('aria-valuemax', '420')
  })

  it('moves by 16px with the arrow keys', () => {
    render(<Harness />)
    fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    expect(handle()).toHaveAttribute('aria-valuenow', '276')
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(handle()).toHaveAttribute('aria-valuenow', '244')
  })

  it('grows toward the left for a handle on the start edge', () => {
    render(<Harness edge="start" />)
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(handle()).toHaveAttribute('aria-valuenow', '276')
  })

  it('stays within the limits', () => {
    render(<Harness initial={412} />)
    fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    expect(handle()).toHaveAttribute('aria-valuenow', '420')
    fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    expect(handle()).toHaveAttribute('aria-valuenow', '420')
    fireEvent.keyDown(handle(), { key: 'Home' })
    expect(handle()).toHaveAttribute('aria-valuenow', '200')
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(handle()).toHaveAttribute('aria-valuenow', '200')
  })

  it('resets on double-click', () => {
    render(<Harness initial={380} />)
    fireEvent.doubleClick(handle())
    expect(handle()).toHaveAttribute('aria-valuenow', '260')
  })

  it('resizes by dragging and applies the drop position', () => {
    const onDragChange = vi.fn()
    render(<Harness onDragChange={onDragChange} />)

    fireEvent.pointerDown(handle(), { pointerId: 1, button: 0, clientX: 260 })
    expect(onDragChange).toHaveBeenLastCalledWith(true)
    expect(document.documentElement).toHaveClass('panel-resizing')

    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 300 })
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 900 })
    fireEvent.pointerUp(handle(), { pointerId: 1, clientX: 900 })

    expect(handle()).toHaveAttribute('aria-valuenow', '420')
    expect(onDragChange).toHaveBeenLastCalledWith(false)
    expect(document.documentElement).not.toHaveClass('panel-resizing')
  })

  it('resizes a height by a scaled vertical drag when horizontal', () => {
    function Split(): React.JSX.Element {
      const [ratio, setRatio] = useState(40)
      return (
        <PanelResizeHandle
          value={ratio}
          min={20}
          max={80}
          step={2}
          scale={100 / 500}
          onChange={setRatio}
          edge="end"
          orientation="horizontal"
          label="Resize split"
        />
      )
    }
    render(<Split />)
    const split = screen.getByRole('separator', { name: 'Resize split' })
    expect(split).toHaveAttribute('aria-orientation', 'horizontal')

    fireEvent.keyDown(split, { key: 'ArrowDown' })
    expect(split).toHaveAttribute('aria-valuenow', '42')
    fireEvent.keyDown(split, { key: 'ArrowRight' })
    expect(split).toHaveAttribute('aria-valuenow', '42')

    fireEvent.pointerDown(split, { pointerId: 2, button: 0, clientX: 0, clientY: 100 })
    expect(document.documentElement).toHaveClass('panel-resizing-row')
    // 50px down of a 500px container is +10%; the sideways move counts for nothing.
    fireEvent.pointerMove(split, { pointerId: 2, clientX: 400, clientY: 150 })
    fireEvent.pointerUp(split, { pointerId: 2, clientX: 400, clientY: 150 })
    expect(split).toHaveAttribute('aria-valuenow', '52')
    expect(document.documentElement).not.toHaveClass('panel-resizing-row')
  })
})
