import { useRef, useState } from 'react'
import type { WorkspaceInfo } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { ACCENT_LABELS, ACCENT_OPTIONS } from '@/core/constants/app.constants'
import { useUiStore } from '@/store'
import { Icon } from '@/shared/components/icons'
import { IconButton, Menu, MenuItem, Swatch, TruncatedText } from '@/shared/components/ui'
import { useSettings, useUpdateSettings } from '@/shared/hooks/useSettings'
import type { WorkspaceActions } from '../hooks/useWorkspace'

export interface WorkspaceHeaderProps {
  workspace: WorkspaceInfo
  actions: WorkspaceActions
}

const folderName = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

export function WorkspaceHeader({ workspace, actions }: WorkspaceHeaderProps): React.JSX.Element {
  const [menu, setMenu] = useState<'switch' | 'more' | null>(null)
  const switchRef = useRef<HTMLButtonElement>(null)
  const moreRef = useRef<HTMLSpanElement>(null)
  const settings = useSettings()
  const { mutate: updateSettings } = useUpdateSettings()
  const notify = useUiStore((s) => s.notify)
  const close = (): void => setMenu(null)
  // The first recent entry is the workspace that is open right now.
  const others = settings.recentWorkspaces.slice(1)

  const reveal = (): void => {
    ipcClient.workspace.reveal('').catch((error: Error) => notify(error.message, 'error'))
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-3">
      <button
        ref={switchRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu === 'switch'}
        aria-label={`Workspace ${workspace.name}, switch workspace`}
        onClick={() => setMenu(menu === 'switch' ? null : 'switch')}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm py-1 text-left"
      >
        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-accent-soft text-[10px] font-bold text-accent-fg">
          {workspace.name.charAt(0).toUpperCase()}
        </span>
        <TruncatedText className="text-[13px] font-semibold text-fg">
          {workspace.name}
        </TruncatedText>
        <Icon name="chevD" size={12} className="shrink-0 text-fg-muted" />
      </button>
      <span ref={moreRef} className="inline-flex">
        <IconButton
          icon="more"
          label="Workspace options"
          size="sm"
          iconSize={14}
          aria-haspopup="menu"
          aria-expanded={menu === 'more'}
          onClick={() => setMenu(menu === 'more' ? null : 'more')}
        />
      </span>

      <Menu
        open={menu === 'switch'}
        onClose={close}
        anchor={switchRef}
        width={240}
        aria-label="Switch workspace"
      >
        {others.map((path) => (
          <MenuItem key={path} icon="folder" onSelect={() => actions.openRecent(path)}>
            <span title={path}>{folderName(path)}</span>
          </MenuItem>
        ))}
        {others.length > 0 && <div role="separator" className="my-1 h-px bg-border" />}
        <MenuItem icon="folder" onSelect={actions.openDialog}>
          Open workspace…
        </MenuItem>
        <MenuItem icon="plus" onSelect={() => actions.create('')}>
          Create workspace…
        </MenuItem>
        <MenuItem icon="close" onSelect={actions.close}>
          Close workspace
        </MenuItem>
      </Menu>

      <Menu
        open={menu === 'more'}
        onClose={close}
        anchor={moreRef}
        placement="bottom-end"
        width={220}
        aria-label="Workspace options"
      >
        <MenuItem icon="folder" onSelect={reveal}>
          Reveal in file manager
        </MenuItem>
        <div className="px-2 pt-2 pb-1 text-[11px] text-fg-muted">Accent color</div>
        <div role="group" aria-label="Accent color" className="flex gap-2 px-2 pb-2">
          {ACCENT_OPTIONS.map((color) => (
            <Swatch
              key={color}
              color={color}
              label={ACCENT_LABELS[color]}
              selected={settings.appearance.accent === color}
              onSelect={() => updateSettings({ appearance: { accent: color } })}
            />
          ))}
        </div>
        <div role="separator" className="my-1 h-px bg-border" />
        <MenuItem icon="close" onSelect={actions.close}>
          Close workspace
        </MenuItem>
      </Menu>
    </div>
  )
}
