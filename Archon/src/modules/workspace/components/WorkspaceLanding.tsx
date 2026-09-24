import { useId, useState, type FormEvent } from 'react'
import { APP_NAME } from '@/core/constants/app.constants'
import { Icon } from '@/shared/components/icons'
import { Button, Input, SectionLabel } from '@/shared/components/ui'
import { useSettings } from '@/shared/hooks/useSettings'
import { useWorkspaceActions } from '../hooks/useWorkspace'
import { RecentWorkspaceList } from './RecentWorkspaceList'

/** Shown instead of the shell body while no workspace is open. */
export function WorkspaceLanding(): React.JSX.Element {
  const nameId = useId()
  const [name, setName] = useState('')
  const { recentWorkspaces } = useSettings()
  const actions = useWorkspaceActions()

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    actions.create(name)
  }

  return (
    <div className="flex h-full min-h-0 overflow-y-auto bg-canvas px-4 py-6">
      <section
        aria-labelledby={`${nameId}-title`}
        className="@container m-auto w-[min(480px,100%)] rounded-lg border border-border bg-bg p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Icon name="folder" size={18} />
          </span>
          <div className="min-w-0">
            <h1 id={`${nameId}-title`} className="text-[16px] font-semibold text-fg">
              Open a workspace
            </h1>
            <p className="text-[12px] text-fg-muted">
              {APP_NAME} keeps documents and diagrams in a folder on your disk.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <SectionLabel htmlFor={nameId}>Workspace name</SectionLabel>
          <Input
            id={nameId}
            value={name}
            placeholder="Defaults to the folder name"
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="mt-3 flex gap-2 @max-[400px]:flex-col">
            <Button
              type="submit"
              variant="primary"
              icon="plus"
              disabled={actions.pending}
              className="@max-[400px]:w-full"
            >
              Create workspace
            </Button>
            <Button
              variant="secondary"
              icon="folder"
              disabled={actions.pending}
              onClick={actions.openDialog}
              className="@max-[400px]:w-full"
            >
              Open workspace…
            </Button>
          </div>
        </form>

        <RecentWorkspaceList
          paths={recentWorkspaces}
          onOpen={actions.openRecent}
          disabled={actions.pending}
        />
      </section>
    </div>
  )
}
