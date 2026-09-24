import type { EditorContribution } from '@/core/types'
import { DiagramEditor } from './components/DiagramEditor'
import { DiagramStatusItems } from './components/DiagramStatusItems'
import { DiagramToolbar } from './components/toolbar/DiagramToolbar'

/** The `.soardiag` editor, registered in `App.tsx`. The inspector comes in plan 16. */
export const diagramEditorContribution: EditorContribution = {
  kind: 'soardiag',
  Editor: DiagramEditor,
  Toolbar: DiagramToolbar,
  StatusItems: DiagramStatusItems
}
