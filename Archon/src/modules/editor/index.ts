export { EditorPane, type EditorPaneProps } from './components/EditorPane'
export { EditorTabs, type EditorTabsProps } from './components/EditorTabs'
export { UnsavedChangesModal } from './components/UnsavedChangesModal'
export {
  registerSaveHandler,
  requestClose,
  useActiveTab,
  useEditorTabs,
  type ActiveTab,
  type EditorTabsApi
} from './hooks/useEditorTabs'
export { useQuitGuard } from './hooks/useQuitGuard'
export { useTabReconciliation } from './hooks/useTabReconciliation'
export { useTabSession } from './hooks/useTabSession'
export { useTabShortcuts } from './hooks/useTabShortcuts'
