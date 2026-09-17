import { useEffect, useEffectEvent, useState, type ComponentType } from 'react'
import type { EditorContribution, ModalId, PanelLayout } from '@/core/types'
import { EditorContributionsProvider } from '@/core/editor/EditorContributionsProvider'
import { useUiStore } from '@/store'
import { AppShell } from '@/shared/components/layout/AppShell'
import { InspectorPanel } from '@/shared/components/layout/InspectorPanel'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { StatusBar } from '@/shared/components/layout/StatusBar'
import { TitleBar } from '@/shared/components/layout/TitleBar'
import type { ThemeToggleValue } from '@/shared/components/layout/title-bar/ThemeToggleButton'
import { EmptyState, Kbd } from '@/shared/components/ui'
import { usePanelLayout } from '@/shared/hooks/usePanelLayout'

// The only place that composes modules. Editor modules register here
// (plans 12 and 13); the shell looks them up by file kind.
const EDITOR_CONTRIBUTIONS: readonly EditorContribution[] = []
const MODALS: Partial<Record<ModalId, ComponentType>> = {}

/** Base panel shortcuts; they move to the shortcut registry in plan 20. */
function usePanelShortcuts(layout: PanelLayout): void {
  const togglePanel = useUiStore((s) => s.togglePanel)

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const mod = event.ctrlKey || event.metaKey
    // `code`, not `key`: Alt changes the produced character on macOS.
    if (!mod || event.shiftKey || event.code !== 'KeyB') return
    event.preventDefault()
    const id = event.altKey ? 'inspector' : 'sidebar'
    togglePanel(id, !layout[id].fits)
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
}

function Placeholder({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState>{children}</EmptyState>
    </div>
  )
}

function App(): React.JSX.Element {
  const layout = usePanelLayout()
  const closeOverlays = useUiStore((s) => s.closeOverlays)
  usePanelShortcuts(layout)

  // Provisional: plan 05 replaces this with persisted settings and `useTheme`.
  const [theme, setTheme] = useState<ThemeToggleValue>('dark')
  const toggleTheme = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  return (
    <EditorContributionsProvider contributions={EDITOR_CONTRIBUTIONS}>
      <AppShell
        layout={layout}
        onMainPointerDown={closeOverlays}
        titleBar={<TitleBar theme={theme} onToggleTheme={toggleTheme} />}
        tabBar={
          <div
            data-testid="tab-bar"
            className="h-[var(--size-tabbar)] shrink-0 border-b border-border bg-side"
          />
        }
        sidebar={
          <Sidebar panel={layout.sidebar}>
            <Placeholder>Workspace</Placeholder>
          </Sidebar>
        }
        main={
          <Placeholder>
            No file open
            <br />
            <Kbd>Ctrl+B</Kbd> sidebar · <Kbd>Ctrl+Alt+B</Kbd> properties
          </Placeholder>
        }
        inspector={
          <InspectorPanel panel={layout.inspector}>
            <Placeholder>Nothing selected</Placeholder>
          </InspectorPanel>
        }
        statusBar={<StatusBar />}
      />
      <ModalHost modals={MODALS} />
    </EditorContributionsProvider>
  )
}

export default App
