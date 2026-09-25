import type { EditorContribution } from '@/core/types'
import { DiagramEditor } from './components/DiagramEditor'
import { DiagramStatusItems } from './components/DiagramStatusItems'
import { PropertiesPanel } from './components/PropertiesPanel'
import { DiagramToolbar } from './components/toolbar/DiagramToolbar'
import { ExportMenu } from './components/toolbar/ExportMenu'

/** The `.ardiag` editor, registered in `App.tsx`. */
export const diagramEditorContribution: EditorContribution = {
  kind: 'ardiag',
  Editor: DiagramEditor,
  Toolbar: DiagramToolbar,
  TitleActions: ExportMenu,
  Inspector: PropertiesPanel,
  StatusItems: DiagramStatusItems
}

export { NewDiagramDialog } from './components/new-diagram/NewDiagramDialog'
