import { useEffect, useEffectEvent, type ComponentType } from 'react'
import type { EditorContribution, ModalId, PanelLayout } from '@/core/types'
import { EditorContributionsProvider } from '@/core/editor/EditorContributionsProvider'
import { useEditorStore, useUiStore } from '@/store'
import { AppShell } from '@/shared/components/layout/AppShell'
import { InspectorPanel } from '@/shared/components/layout/InspectorPanel'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { ShellStatusBar } from '@/shared/components/layout/ShellStatusBar'
import { TitleBar } from '@/shared/components/layout/TitleBar'
import { ToastViewport } from '@/shared/components/layout/ToastViewport'
import { EmptyState, Kbd } from '@/shared/components/ui'
import { useIndexProgress } from '@/shared/hooks/useIndexProgress'
import { useLayoutPersistence } from '@/shared/hooks/useLayoutPersistence'
import { usePanelLayout } from '@/shared/hooks/usePanelLayout'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { useTheme } from '@/shared/hooks/useTheme'
import { useUiZoom } from '@/shared/hooks/useUiZoom'
import { formatShortcut } from '@/shared/utils/platform'
import {
  ConfirmDeleteModal,
  WorkspaceLanding,
  WorkspaceSidebar,
  useWorkspaceSync
} from '@/modules/workspace'

// The only place that composes modules. Editor modules register here
// (plans 12 and 13); the shell looks them up by file kind.
const EDITOR_CONTRIBUTIONS: readonly EditorContribution[] = []
const MODALS: Partial<Record<ModalId, ComponentType>> = {
  'confirm-delete': ConfirmDeleteModal
}

/** Base panel shortcuts; they move to the shortcut registry in plan 20 (zoom lives in `useUiZoom`). */
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
  const togglePanel = useUiStore((s) => s.togglePanel)
  const activePath = useEditorStore((s) => s.activePath)
  usePanelShortcuts(layout)
  useLayoutPersistence()
  useUiZoom()
  useIndexProgress()
  const { resolvedTheme, toggleTheme } = useTheme()
  const platform = usePlatform()
  const workspace = useWorkspaceSync()
  // Until main answers, an empty canvas: no flash of the landing screen.
  const bodyOverride = workspace.current ? undefined : workspace.ready ? <WorkspaceLanding /> : null

  return (
    <EditorContributionsProvider contributions={EDITOR_CONTRIBUTIONS}>
      <AppShell
        layout={layout}
        onMainPointerDown={closeOverlays}
        bodyOverride={bodyOverride}
        titleBar={<TitleBar theme={resolvedTheme} onToggleTheme={toggleTheme} />}
        tabBar={
          <div
            data-testid="tab-bar"
            className="h-[var(--size-tabbar)] shrink-0 border-b border-border bg-side"
          />
        }
        sidebar={
          <Sidebar panel={layout.sidebar}>
            <WorkspaceSidebar
              onToggleInspector={() => togglePanel('inspector', !layout.inspector.fits)}
            />
          </Sidebar>
        }
        main={
          // Plan 11 replaces this with the tab system and the editors.
          <Placeholder>
            {activePath ? <span className="font-mono">{activePath}</span> : 'No file open'}
            <br />
            <Kbd>{formatShortcut(platform, 'B')}</Kbd> sidebar ·{' '}
            <Kbd>{formatShortcut(platform, 'Alt+B')}</Kbd> properties
          </Placeholder>
        }
        inspector={
          <InspectorPanel panel={layout.inspector}>
            <Placeholder>Nothing selected</Placeholder>
          </InspectorPanel>
        }
        // Plan 11 adds the active editor's `StatusItems`.
        statusBar={<ShellStatusBar activePath={activePath ?? undefined} />}
      />
      <ModalHost modals={MODALS} />
      <ToastViewport />
    </EditorContributionsProvider>
  )
}

export default App
