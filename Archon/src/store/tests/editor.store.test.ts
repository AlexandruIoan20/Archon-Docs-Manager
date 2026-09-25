import { beforeEach, describe, expect, it } from 'vitest'
import { selectActivePath, selectActiveTab, useEditorStore } from '../editor.store'

const initialState = useEditorStore.getState()
const state = (): ReturnType<typeof useEditorStore.getState> => useEditorStore.getState()
const paths = (): string[] => state().tabs.map((tab) => tab.relPath)
const idOf = (relPath: string): string =>
  state().tabs.find((tab) => tab.relPath === relPath)?.id ?? ''

function openThree(): void {
  state().openFile('a.ardoc', 'ardoc')
  state().openFile('Flows/b.ardiag', 'ardiag')
  state().openFile('c.ardoc', 'ardoc')
}

describe('editor.store', () => {
  beforeEach(() => {
    useEditorStore.setState(initialState, true)
  })

  it('opens a tab per file, titled without the extension', () => {
    const id = state().openFile('Runbooks/on-call.ardoc', 'ardoc')
    expect(selectActiveTab(state())).toEqual({
      id,
      relPath: 'Runbooks/on-call.ardoc',
      kind: 'ardoc',
      title: 'on-call',
      dirty: false
    })
  })

  it('only activates a file that is already open', () => {
    openThree()
    const id = state().openFile('a.ardoc', 'ardoc')
    expect(id).toBe(idOf('a.ardoc'))
    expect(paths()).toEqual(['a.ardoc', 'Flows/b.ardiag', 'c.ardoc'])
    expect(selectActivePath(state())).toBe('a.ardoc')
  })

  it('activates the last remaining tab when the active one closes', () => {
    openThree()
    state().activate(idOf('Flows/b.ardiag'))
    state().close(idOf('Flows/b.ardiag'))
    expect(selectActivePath(state())).toBe('c.ardoc')

    state().close(idOf('a.ardoc'))
    expect(selectActivePath(state())).toBe('c.ardoc')
    state().close(idOf('c.ardoc'))
    expect(state().activeId).toBeNull()
  })

  it('closes the others and those to the right', () => {
    openThree()
    state().closeToRight(idOf('a.ardoc'))
    expect(paths()).toEqual(['a.ardoc'])
    expect(selectActivePath(state())).toBe('a.ardoc')

    openThree()
    state().closeOthers(idOf('Flows/b.ardiag'))
    expect(paths()).toEqual(['Flows/b.ardiag'])
    expect(selectActivePath(state())).toBe('Flows/b.ardiag')
  })

  it('reorders tabs', () => {
    openThree()
    state().reorder(2, 0)
    expect(paths()).toEqual(['c.ardoc', 'a.ardoc', 'Flows/b.ardiag'])
    state().reorder(0, 9)
    expect(paths()).toEqual(['c.ardoc', 'a.ardoc', 'Flows/b.ardiag'])
  })

  it('marks a tab dirty and clean', () => {
    openThree()
    state().setDirty(idOf('a.ardoc'), true)
    expect(state().tabs[0]?.dirty).toBe(true)
    state().setDirty(idOf('a.ardoc'), false)
    expect(state().tabs[0]?.dirty).toBe(false)
  })

  it('follows renames of the file or its folders, keeping the tab id', () => {
    openThree()
    const id = idOf('Flows/b.ardiag')
    state().renameTabPath('Flows', 'Playbooks')
    expect(paths()).toContain('Playbooks/b.ardiag')
    state().renameTabPath('Playbooks/b.ardiag', 'Playbooks/triage.ardiag')
    expect(state().tabs.find((tab) => tab.id === id)).toMatchObject({
      relPath: 'Playbooks/triage.ardiag',
      title: 'triage'
    })
  })

  it('closes tabs of a deleted file or folder', () => {
    openThree()
    state().openFile('Flows/sub/d.ardoc', 'ardoc')
    const closed = state().closeByPath('Flows')
    expect(closed.map((tab) => tab.relPath)).toEqual(['Flows/b.ardiag', 'Flows/sub/d.ardoc'])
    expect(paths()).toEqual(['a.ardoc', 'c.ardoc'])
    expect(selectActivePath(state())).toBe('c.ardoc')
    expect(state().closeByPath('Other')).toEqual([])
  })

  it('hydrates saved tabs without duplicates', () => {
    state().hydrate(
      [
        { relPath: 'a.ardoc', kind: 'ardoc' },
        { relPath: 'b.ardiag', kind: 'ardiag' },
        { relPath: 'a.ardoc', kind: 'ardoc' }
      ],
      'a.ardoc'
    )
    expect(paths()).toEqual(['a.ardoc', 'b.ardiag'])
    expect(selectActivePath(state())).toBe('a.ardoc')

    state().hydrate([], null)
    expect(state()).toMatchObject({ tabs: [], activeId: null })
  })

  it('hands the pending selection of a tab over once', () => {
    const id = state().openFile('a.ardiag', 'ardiag')
    expect(state().takePendingSelection(id)).toBeNull()
    state().setPendingSelection(id, ['N1'])
    expect(state().takePendingSelection(id)).toEqual(['N1'])
    expect(state().takePendingSelection(id)).toBeNull()
  })
})
