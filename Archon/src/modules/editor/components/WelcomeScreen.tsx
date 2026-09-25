import type { AppPlatform } from '@/core/types'
import { Icon } from '@/shared/components/icons'
import { Button, Kbd } from '@/shared/components/ui'
import { getShortcut, type ShortcutId } from '@/core/constants/shortcuts'
import { formatCombo } from '@/shared/utils/platform'

export interface WelcomeScreenProps {
  platform: AppPlatform | undefined
  onNewDiagram: () => void
  onNewDocument: () => void
}

/** A few of the registry's shortcuts; Ctrl/Cmd+/ lists them all. */
const HINTS: readonly ShortcutId[] = [
  'search.open',
  'file.save',
  'tab.close',
  'panel.sidebar',
  'panel.inspector',
  'shortcuts.help'
]

/** The main area when no file is open. */
export function WelcomeScreen({
  platform,
  onNewDiagram,
  onNewDocument
}: WelcomeScreenProps): React.JSX.Element {
  return (
    <div className="@container flex flex-1 overflow-y-auto bg-canvas px-4 py-6">
      <div className="m-auto flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon name="layers" size={20} />
          </span>
          <h1 className="text-[16px] font-semibold text-fg">No file open</h1>
          <p className="text-[12px] text-fg-subtle">
            Pick a file in the sidebar, or start something new.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 @[360px]:flex-row @[360px]:justify-center">
          <Button variant="primary" icon="flow" onClick={onNewDiagram}>
            New diagram
          </Button>
          <Button icon="file" onClick={onNewDocument}>
            New document
          </Button>
        </div>
        <dl className="grid w-full max-w-[280px] grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[12px]">
          {HINTS.map(getShortcut).map(({ id, keys, description }) => (
            <div key={id} className="contents">
              <dt className="text-left text-fg-muted">{description}</dt>
              <dd className="m-0 text-right">
                <Kbd>{formatCombo(platform, keys[0] ?? '')}</Kbd>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
