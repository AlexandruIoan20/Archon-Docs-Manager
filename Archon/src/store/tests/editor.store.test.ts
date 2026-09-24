import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '../editor.store'

const initialState = useEditorStore.getState()
const state = (): ReturnType<typeof useEditorStore.getState> => useEditorStore.getState()

describe('editor.store (minimal)', () => {
  beforeEach(() => {
    useEditorStore.setState(initialState, true)
  })

  it('opens and closes the active file', () => {
    state().openFile('Runbooks/on-call.soardoc', 'soardoc')
    expect(state()).toMatchObject({ activePath: 'Runbooks/on-call.soardoc', activeKind: 'soardoc' })
    state().closeActive()
    expect(state().activePath).toBeNull()
  })

  it('follows renames of the file or its folders', () => {
    state().openFile('Runbooks/on-call.soardoc', 'soardoc')
    state().renamePath('Runbooks', 'Ops')
    expect(state().activePath).toBe('Ops/on-call.soardoc')
    state().renamePath('Other', 'Else')
    expect(state().activePath).toBe('Ops/on-call.soardoc')
  })

  it('closes the file when it or its folder is deleted', () => {
    state().openFile('Runbooks/on-call.soardoc', 'soardoc')
    state().closeByPath('Playbooks')
    expect(state().activePath).toBe('Runbooks/on-call.soardoc')
    state().closeByPath('Runbooks')
    expect(state().activePath).toBeNull()
  })
})
