import { Icon } from '@/shared/components/icons'
import { SectionLabel } from '@/shared/components/ui'
import { truncateMiddle } from '@/shared/utils/truncate-middle'

export interface RecentWorkspaceListProps {
  paths: readonly string[]
  onOpen: (rootPath: string) => void
  disabled?: boolean
}

const PATH_MAX_CHARS = 56

const folderName = (path: string): string => path.split(/[\\/]/).filter(Boolean).pop() ?? path

export function RecentWorkspaceList({
  paths,
  onOpen,
  disabled = false
}: RecentWorkspaceListProps): React.JSX.Element | null {
  if (paths.length === 0) return null

  return (
    <div className="mt-6">
      <SectionLabel id="recent-workspaces">Recent</SectionLabel>
      <ul aria-labelledby="recent-workspaces" className="flex flex-col gap-0.5">
        {paths.map((path) => (
          <li key={path}>
            <button
              type="button"
              disabled={disabled}
              title={path}
              onClick={() => onOpen(path)}
              className="flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-left hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon name="folder" size={14} className="shrink-0 text-fg-muted" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] text-fg">{folderName(path)}</span>
                <span className="truncate font-mono text-[11px] text-fg-subtle">
                  {truncateMiddle(path.replaceAll('\\', '/'), PATH_MAX_CHARS)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
