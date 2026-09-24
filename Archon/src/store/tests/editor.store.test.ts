import { beforeEach, describe, expect, it } from 'vitest'
import { selectActivePath, selectActiveTab, useEditorStore } from '../editor.store'

const initialState = useEditorStore.getState()
const state = (): ReturnType<typeof useEditorStore.getState> => useEditorStore.getState()
const paths = (): string[] => state().tabs.map((tab) => tab.relPath)
const idOf = (relPath: string): string =>
  state().tabs.find((tab) => tab.relPath === relPath)?.id ?? ''

function openThree(): void {
  state().openFile('a.soardoc', 'soardoc')
  state().openFile('Flows/b.soardiag', 'soardiag')
  state().openFile('c.soardoc', 'soardoc')
}

describe('editor.store', () => {
  beforeEach(() => {
    useEditorStore.setState(initialState, true)
  })

  it('opens a tab per file, titled without the extension', () => {
    const id = state().openFile('Runbooks/on-call.soardoc', 'soardoc')
    expect(selectActiveTab(state())).toEqual({
      id,
      relPath: 'Runbooks/on-call.soardoc',
      kind: 'soardoc',
      title: 'on-call',
      dirty: false
    })
  })

  it('only activates a file that is already open', () => {
    openThree()
    const id = state().openFile('a.soardoc', 'soardoc')
    expect(id).toBe(idOf('a.soardoc'))
    expect(paths()).toEqual(['a.soardoc', 'Flows/b.soardiag', 'c.soardoc'])
    expect(selectActivePath(state())).toBe('a.soardoc')
  })

  it('activates the last remaining tab when the active one closes', () => {
    openThree()
    state().activate(idOf('Flows/b.soardiag'))
    state().close(idOf('Flows/b.soardiag'))
    expect(selectActivePath(state())).toBe('c.soardoc')

    state().close(idOf('a.soardoc'))
    expect(selectActivePath(state())).toBe('c.soardoc')
    state().close(idOf('c.soardoc'))
    expect(state().activeId).toBeNull()
  })

  it('closes the others and those to the right', () => {
    openThree()
    state().closeToRight(idOf('a.soardoc'))
    expect(paths()).toEqual(['a.soardoc'])
    expect(selectActivePath(state())).toBe('a.soardoc')

    openThree()
    state().closeOthers(idOf('Flows/b.soardiag'))
    expect(paths()).toEqual(['Flows/b.soardiag'])
    expect(selectActivePath(state())).toBe('Flows/b.soardiag')
  })

  it('reorders tabs', () => {
    openThree()
    state().reorder(2, 0)
    expect(paths()).toEqual(['c.soardoc', 'a.soardoc', 'Flows/b.soardiag'])
    state().reorder(0, 9)
    expect(paths()).toEqual(['c.soardoc', 'a.soardoc', 'Flows/b.soardiag'])
  })

  it('marks a tab dirty and clean', () => {
    openThree()
    state().setDirty(idOf('a.soardoc'), true)
    expect(state().tabs[0]?.dirty).toBe(true)
    state().setDirty(idOf('a.soardoc'), false)
    expect(state().tabs[0]?.dirty).toBe(false)
  })

  it('follows renames of the file or its folders, keeping the tab id', () => {
    openThree()
    const id = idOf('Flows/b.soardiag')
    state().renameTabPath('Flows', 'Playbooks')
    expect(paths()).toContain('Playbooks/b.soardiag')
    state().renameTabPath('Playbooks/b.soardiag', 'Playbooks/triage.soardiag')
    expect(state().tabs.find((tab) => tab.id === id)).toMatchObject({
      relPath: 'Playbooks/triage.soardiag',
      title: 'triage'
    })
  })

  it('closes tabs of a deleted file or folder', () => {
    openThree()
    state().openFile('Flows/sub/d.soardoc', 'soardoc')
    const closed = state().closeByPath('Flows')
    expect(closed.map((tab) => tab.relPath)).toEqual(['Flows/b.soardiag', 'Flows/sub/d.soardoc'])
    expect(paths()).toEqual(['a.soardoc', 'c.soardoc'])
    expect(selectActivePath(state())).toBe('c.soardoc')
    expect(state().closeByPath('Other')).toEqual([])
  })

  it('hydrates saved tabs without duplicates', () => {
    state().hydrate(
      [
        { relPath: 'a.soardoc', kind: 'soardoc' },
        { relPath: 'b.soardiag', kind: 'soardiag' },
        { relPath: 'a.soardoc', kind: 'soardoc' }
      ],
      'a.soardoc'
    )
    expect(paths()).toEqual(['a.soardoc', 'b.soardiag'])
    expect(selectActivePath(state())).toBe('a.soardoc')

    state().hydrate([], null)
    expect(state()).toMatchObject({ tabs: [], activeId: null })
  })
})
