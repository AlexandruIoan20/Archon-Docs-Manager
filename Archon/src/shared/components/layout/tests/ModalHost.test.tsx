import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useUiStore } from '@/store'
import { ModalHost } from '../ModalHost'

const initialState = useUiStore.getState()
const NewDiagram = (): React.JSX.Element => <p>new diagram dialog</p>

describe('ModalHost', () => {
  beforeEach(() => {
    useUiStore.setState(initialState, true)
  })

  it('renders the active registered modal', () => {
    render(<ModalHost modals={{ 'new-diagram': NewDiagram }} />)
    expect(screen.queryByText('new diagram dialog')).not.toBeInTheDocument()

    act(() => useUiStore.getState().openModal('new-diagram'))
    expect(screen.getByText('new diagram dialog')).toBeInTheDocument()

    act(() => useUiStore.getState().closeModal())
    expect(screen.queryByText('new diagram dialog')).not.toBeInTheDocument()
  })

  it('renders nothing for a modal nobody registered', () => {
    const { container } = render(<ModalHost modals={{}} />)
    act(() => useUiStore.getState().openModal('confirm'))
    expect(container).toBeEmptyDOMElement()
  })
})
