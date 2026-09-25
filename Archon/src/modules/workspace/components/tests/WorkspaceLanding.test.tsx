import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DEFAULT_SETTINGS } from '@/core/constants/app.constants'
import { mergeSettings } from '@/core/settings/normalize-settings'
import { useUiStore } from '@/store'
import { createArchonApiMock, type ArchonApiMock } from '@/test/archon-api-mock'
import { queryWrapper } from '@/test/render-with-query'
import { fail } from '@/test/workspace-api-mock'
import { WorkspaceLanding } from '../WorkspaceLanding'

const RECENT = [
  '/home/ana/work/secops-core',
  '/home/ana/work/clients/acme/very/deep/folder/structure/that/keeps/going/runbooks'
]
const initialUi = useUiStore.getState()

describe('WorkspaceLanding', () => {
  let mock: ArchonApiMock

  beforeEach(() => {
    useUiStore.setState(initialUi, true)
    mock = createArchonApiMock({
      workspace: null,
      settings: mergeSettings(DEFAULT_SETTINGS, { recentWorkspaces: RECENT })
    })
    window.archon = mock.api
    render(<WorkspaceLanding />, { wrapper: queryWrapper() })
  })

  afterEach(() => {
    delete window.archon
  })

  it('creates a workspace with the typed name', async () => {
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'SecOps Core' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }))
    await waitFor(() => expect(mock.api.workspace.create).toHaveBeenCalledWith('SecOps Core'))
  })

  it('opens a workspace through the dialog', async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open workspace…' }))
    await waitFor(() => expect(mock.api.workspace.openDialog).toHaveBeenCalledOnce())
  })

  it('lists recent workspaces with their full path in a tooltip', async () => {
    const recent = await screen.findByRole('button', { name: /secops-core/ })
    expect(recent).toHaveAttribute('title', RECENT[0])
    const deep = screen.getByRole('button', { name: /runbooks/ })
    expect(deep).toHaveAttribute('title', RECENT[1])
    expect(deep).toHaveTextContent('…')

    fireEvent.click(recent)
    await waitFor(() => expect(mock.api.workspace.openRecent).toHaveBeenCalledWith(RECENT[0]))
  })

  it('reports a recent workspace that no longer exists', async () => {
    mock.api.workspace.openRecent.mockResolvedValueOnce(
      fail('NOT_FOUND', '/home/ana/work/secops-core does not exist')
    )
    fireEvent.click(await screen.findByRole('button', { name: /secops-core/ }))
    await waitFor(() =>
      expect(useUiStore.getState().toast).toMatchObject({
        tone: 'error',
        message: expect.stringContaining('removed from the recent list')
      })
    )
  })
})
