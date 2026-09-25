import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/core/constants/app.constants'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useWorkspaceStore } from '@/store'
import { SegmentedControl } from '@/shared/components/ui'
import { folderPaths } from '../../utils/folder-paths'

export interface DestinationPickerProps {
  value: string
  onChange: (folder: string) => void
}

/** „saves to”: all the folders, scrolling sideways; the chosen one kept in view. */
export function DestinationPicker({ value, onChange }: DestinationPickerProps): React.JSX.Element {
  const workspace = useWorkspaceStore((s) => s.current)
  const scrollRef = useRef<HTMLDivElement>(null)
  // The same query as the file tree, so the cache is shared.
  const { data: tree } = useQuery({
    queryKey: [...QUERY_KEYS.workspaceTree, workspace?.id ?? ''],
    queryFn: ipcClient.workspace.readTree,
    enabled: workspace !== null,
    staleTime: Infinity,
    retry: false
  })
  const paths = tree ? folderPaths(tree) : ['']
  const options = (paths.includes(value) ? paths : [...paths, value]).map((path) => ({
    value: path,
    label: path === '' ? `${workspace?.rootName ?? 'Workspace'}/` : `${path}/`
  }))

  useEffect(() => {
    const chosen = scrollRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    chosen?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [value])

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[11px] text-fg-muted">saves to</span>
      <div ref={scrollRef} className="max-w-[380px] min-w-0 overflow-x-auto">
        <SegmentedControl
          variant="pills"
          aria-label="Destination folder"
          value={value}
          onChange={onChange}
          options={options}
        />
      </div>
    </div>
  )
}
