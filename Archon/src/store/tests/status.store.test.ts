import { beforeEach, describe, expect, it } from 'vitest'
import { useStatusStore } from '../status.store'

const initialState = useStatusStore.getState()

describe('status.store', () => {
  beforeEach(() => {
    useStatusStore.setState(initialState, true)
  })

  it('starts ready', () => {
    expect(useStatusStore.getState()).toMatchObject({ statusText: 'Ready', statusTone: 'ready' })
  })

  it('sets a busy status and resets it', () => {
    useStatusStore.getState().setStatus('Connecting…')
    expect(useStatusStore.getState()).toMatchObject({
      statusText: 'Connecting…',
      statusTone: 'busy'
    })

    useStatusStore.getState().resetStatus()
    expect(useStatusStore.getState()).toMatchObject({ statusText: 'Ready', statusTone: 'ready' })
  })
})
