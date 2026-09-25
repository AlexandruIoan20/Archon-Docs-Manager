import type { ComponentType } from 'react'
import type { EditorContribution, EditorSlotProps, EditorTabRef, ModalId } from '@/core/types'
import {
  EditorContributionsProvider,
  useEditorContribution
} from '@/core/editor/EditorContributionsProvider'
import { openSearchPalette, useUiStore } from '@/store'
import { AppShell } from '@/shared/components/layout/AppShell'
import { InspectorPanel } from '@/shared/components/layout/InspectorPanel'
import { ModalHost } from '@/shared/components/layout/ModalHost'
import { ShortcutsHelp } from '@/shared/components/layout/ShortcutsHelp'
import { Sidebar } from '@/shared/components/layout/Sidebar'
import { ShellStatusBar } from '@/shared/components/layout/ShellStatusBar'
import { TitleBar } from '@/shared/components/layout/TitleBar'
import { ToastViewport } from '@/shared/components/layout/ToastViewport'
import { EmptyState } from '@/shared/components/ui'
import { useIndexProgress } from '@/shared/hooks/useIndexProgress'
import { useShortcuts } from '@/shared/hooks/useKeyboard'
import { useLayoutPersistence } from '@/shared/hooks/useLayoutPersistence'
import { usePanelLayout } from '@/shared/hooks/usePanelLayout'
import { usePanelShortcuts } from '@/shared/hooks/usePanelShortcuts'
import { usePlatform } from '@/shared/hooks/usePlatform'
import { useTheme } from '@/shared/hooks/useTheme'
import { useUiZoom } from '@/shared/hooks/useUiZoom'
import {
  ConfirmDeleteModal,
  WorkspaceLanding,
  WorkspaceSidebar,
  useFileActions,
  useWorkspaceSync,
  useWorkspaceTree
} from '@/modules/workspace'
import {
  EditorPane,
  EditorTabs,
  UnsavedChangesModal,
  useActiveTab,
  useQuitGuard,
  useTabReconciliation,
  useTabSession,
  useTabShortcuts
} from '@/modules/editor'
import { documentEditorContribution } from '@/modules/document-editor'
import { diagramEditorContribution, NewDiagramDialog } from '@/modules/diagram-editor'
import { GlobalSearch } from '@/modules/search'

// The only place that composes modules. Editor modules register here
// (plans 12 and 13); the shell looks them up by file kind.
const EDITOR_CONTRIBUTIONS: readonly EditorContribution[] = [
  documentEditorContribution,
  diagramEditorContribution
]
const MODALS: Partial<Record<ModalId, ComponentType>> = {
  'command-palette': GlobalSearch,
  'confirm-delete': ConfirmDeleteModal,
  'new-diagram': NewDiagramDialog,
  'shortcuts-help': ShortcutsHelp,
  'unsaved-changes': UnsavedChangesModal
}

/** One of the active editor's slot components, or nothing. */
function slot(
  Slot: ComponentType<EditorSlotProps> | undefined,
  tab: EditorTabRef | null
): React.JSX.Element | undefined {
  return Slot && tab ? <Slot tab={tab} /> : undefined
}

/** Tabs follow the workspace: restored, saved, closed when their files go away. */
function useEditorSession(): ReturnType<typeof useWorkspaceSync> {
  const workspace = useWorkspaceSync()
  const { tree } = useWorkspaceTree()
  useTabSession(workspace.current?.id, tree)
  useTabReconciliation(tree)
  useTabShortcuts()
  useQuitGuard()
  return workspace
}

function Workbench(): React.JSX.Element {
  const layout = usePanelLayout()
  const closeOverlays = useUiStore((s) => s.closeOverlays)
  const togglePanel = useUiStore((s) => s.togglePanel)
  const openModal = useUiStore((s) => s.openModal)
  usePanelShortcuts(layout)
  useLayoutPersistence()
  useUiZoom()
  useIndexProgress()
  const { resolvedTheme, toggleTheme } = useTheme()
  const platform = usePlatform()
  const workspace = useEditorSession()
  const fileActions = useFileActions()
  const { ref: tab } = useActiveTab()
  const contribution = useEditorContribution(tab?.kind)
  // Until main answers, an empty canvas: no flash of the landing screen.
  const bodyOverride = workspace.current ? undefined : workspace.ready ? <WorkspaceLanding /> : null

  const newDiagram = (): void => openModal('new-diagram')

  useShortcuts({
    // The index belongs to a workspace: nothing to search without one.
    'search.open': () => {
      if (workspace.current) openSearchPalette()
    },
    'shortcuts.help': () => openModal('shortcuts-help')
  })

  return (
    <>
      <AppShell
        layout={layout}
        onMainPointerDown={closeOverlays}
        bodyOverride={bodyOverride}
        titleBar={
          <TitleBar
            toolbar={slot(contribution?.Toolbar, tab)}
            actions={slot(contribution?.TitleActions, tab)}
            theme={resolvedTheme}
            onToggleTheme={toggleTheme}
          />
        }
        tabBar={<EditorTabs onNew={newDiagram} />}
        sidebar={
          <Sidebar panel={layout.sidebar}>
            <WorkspaceSidebar
              onToggleInspector={() => togglePanel('inspector', !layout.inspector.fits)}
              onNewDiagram={newDiagram}
            />
          </Sidebar>
        }
        main={
          <EditorPane
            platform={platform}
            onNewDiagram={newDiagram}
            onNewDocument={() => void fileActions.newDocument()}
          />
        }
        inspector={
          <InspectorPanel panel={layout.inspector}>
            {slot(contribution?.Inspector, tab) ?? (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState>Nothing selected</EmptyState>
              </div>
            )}
          </InspectorPanel>
        }
        statusBar={
          <ShellStatusBar
            activePath={tab?.filePath}
            editorItems={slot(contribution?.StatusItems, tab)}
          />
        }
      />
      <ModalHost modals={MODALS} />
      <ToastViewport />
    </>
  )
}

function App(): React.JSX.Element {
  return (
    <EditorContributionsProvider contributions={EDITOR_CONTRIBUTIONS}>
      <Workbench />
    </EditorContributionsProvider>
  )
}

export default App
