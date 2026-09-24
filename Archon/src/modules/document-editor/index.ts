import type { EditorContribution } from '@/core/types'
import { DocumentEditor } from './components/DocumentEditor'
import { DocumentInspector } from './components/DocumentInspector'
import { DocumentStatusItems } from './components/DocumentStatusItems'
import { Toolbar } from './components/Toolbar'

/** The `.soardoc` editor, registered in `App.tsx`. */
export const documentEditorContribution: EditorContribution = {
  kind: 'soardoc',
  Editor: DocumentEditor,
  Toolbar,
  Inspector: DocumentInspector,
  StatusItems: DocumentStatusItems
}
