import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_WORKSPACE } from '@/test/workspace-api-mock'
import { selectExpandedPaths, useWorkspaceStore } from '../workspace.store'

const initialState = useWorkspaceStore.getState()
const state = (): ReturnType<typeof useWorkspaceStore.getState> => useWorkspaceStore.getState()

describe('workspace.store', () => {
  beforeEach(() => {
    useWorkspaceStore.setState(initialState, true)
  })

  it('toggles and sets folder expansion', () => {
    state().toggleExpanded('Playbooks')
    expect(state().expanded).toEqual({ Playbooks: true })
    state().toggleExpanded('Playbooks')
    expect(state().expanded).toEqual({ Playbooks: false })
    state().setExpanded('Runbooks', true)
    expect(selectExpandedPaths(state())).toEqual(['Runbooks'])
  })

  it('hydrates saved expansion', () => {
    state().hydrateExpanded(['b', 'a'])
    expect(selectExpandedPaths(state())).toEqual(['a', 'b'])
  })

  it('keeps tree state while the same workspace is updated', () => {
    state().setCurrent(SAMPLE_WORKSPACE)
    state().setExpanded('Playbooks', true)
    state().setTargetFolder('Playbooks')
    state().setCurrent({ ...SAMPLE_WORKSPACE, name: 'Renamed' })
    expect(state().targetFolder).toBe('Playbooks')
    expect(state().expanded).toEqual({ Playbooks: true })
  })

  it('resets tree state when another workspace opens', () => {
    state().setCurrent(SAMPLE_WORKSPACE)
    state().setExpanded('Playbooks', true)
    state().setTargetFolder('Playbooks')
    state().setSideTab('diagrams')
    state().setQuery('triage')
    state().setCurrent({ ...SAMPLE_WORKSPACE, id: 'another' })
    expect(state()).toMatchObject({ expanded: {}, targetFolder: '', sideTab: 'files', query: '' })
  })
})

describe('workspace.store path bookkeeping', () => {
  beforeEach(() => {
    useWorkspaceStore.setState(initialState, true)
  })

  it('remaps expansion and target after a folder rename', () => {
    state().hydrateExpanded(['Playbooks', 'Playbooks/Phishing', 'Runbooks'])
    state().setTargetFolder('Playbooks/Phishing')
    state().remapPaths('Playbooks', 'Plays')
    expect(selectExpandedPaths(state())).toEqual(['Plays', 'Plays/Phishing', 'Runbooks'])
    expect(state().targetFolder).toBe('Plays/Phishing')
  })

  it('forgets a deleted folder and moves the target to its parent', () => {
    state().hydrateExpanded(['Playbooks', 'Playbooks/Phishing', 'Runbooks'])
    state().setTargetFolder('Playbooks/Phishing')
    state().forgetPaths('Playbooks/Phishing', 'Playbooks')
    expect(selectExpandedPaths(state())).toEqual(['Playbooks', 'Runbooks'])
    expect(state().targetFolder).toBe('Playbooks')
  })
})
