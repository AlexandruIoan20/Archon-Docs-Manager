import { useEditorContribution } from '@/core/editor/EditorContributionsProvider'
import type { AppPlatform } from '@/core/types'
import { EmptyState } from '@/shared/components/ui'
import { useActiveTab } from '../hooks/useEditorTabs'
import { EditorErrorBoundary } from './EditorErrorBoundary'
import { WelcomeScreen } from './WelcomeScreen'

export interface EditorPaneProps {
  platform: AppPlatform | undefined
  onNewDiagram: () => void
  onNewDocument: () => void
}

/** The main area: the active tab's editor, picked by file kind, or the welcome screen. */
export function EditorPane({
  platform,
  onNewDiagram,
  onNewDocument
}: EditorPaneProps): React.JSX.Element {
  const { tab, ref } = useActiveTab()
  const contribution = useEditorContribution(tab?.kind)

  if (!tab || !ref) {
    return (
      <WelcomeScreen
        platform={platform}
        onNewDiagram={onNewDiagram}
        onNewDocument={onNewDocument}
      />
    )
  }

  if (!contribution) {
    return (
      <div role="alert" className="flex flex-1 items-center justify-center p-6">
        <EmptyState>
          No editor is available for <span className="font-mono">{tab.relPath}</span>.
        </EmptyState>
      </div>
    )
  }

  const { Editor } = contribution
  // Keyed by tab: switching tabs mounts a fresh editor (the old one flushes its save).
  return (
    <EditorErrorBoundary key={tab.id} label={tab.title}>
      <Editor tab={ref} />
    </EditorErrorBoundary>
  )
}
