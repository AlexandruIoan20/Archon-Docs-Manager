import { useId } from 'react'
import { SHORTCUT_SCOPES, SHORTCUTS, type ShortcutDef } from '@/core/constants/shortcuts'
import { useUiStore } from '@/store'
import { IconButton, Kbd, Modal, ModalBody } from '@/shared/components/ui'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { formatCombo, platformFromUserAgent } from '@/shared/utils/platform'

const ALL: readonly ShortcutDef[] = SHORTCUTS

/** Registered in `App.tsx` as the `shortcuts-help` modal (Ctrl/Cmd+/): the whole registry. */
export function ShortcutsHelp(): React.JSX.Element {
  const titleId = useId()
  const closeModal = useUiStore((s) => s.closeModal)
  const platform = usePlatform() ?? platformFromUserAgent()

  return (
    <Modal open onClose={closeModal} width={960} height={640} aria-labelledby={titleId}>
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <h2 id={titleId} className="text-[14px] font-semibold text-fg">
          Keyboard shortcuts
        </h2>
        <IconButton icon="close" label="Close" size="md" onClick={closeModal} />
      </header>
      <ModalBody className="px-4 py-3">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 @min-[900px]/modal:grid-cols-2">
          {SHORTCUT_SCOPES.map((scope) => (
            <section key={scope.id} aria-labelledby={`${titleId}-${scope.id}`}>
              <h3
                id={`${titleId}-${scope.id}`}
                className="mb-1.5 text-[10px] font-semibold tracking-[.6px] text-fg-subtle uppercase"
              >
                {scope.label}
              </h3>
              <dl className="m-0">
                {ALL.filter((s) => s.scope === scope.id).map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex flex-col gap-0.5 border-b border-border py-1.5 last:border-b-0 @min-[480px]/modal:flex-row @min-[480px]/modal:items-center @min-[480px]/modal:justify-between @min-[480px]/modal:gap-4"
                  >
                    <dt className="min-w-0 text-[12px] text-fg-muted">{shortcut.description}</dt>
                    <dd className="m-0 flex shrink-0 flex-wrap gap-1.5">
                      {shortcut.keys.map((combo) => (
                        <Kbd
                          key={combo}
                          className="rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 opacity-100"
                        >
                          {formatCombo(platform, combo)}
                        </Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </ModalBody>
    </Modal>
  )
}
