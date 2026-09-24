import type { SoarDocument } from '@/core/types'
import { ipcClient } from '@/core/ipc/ipc-client'
import { useFileAutosave, type FileAutosave } from '@/shared/hooks/useFileAutosave'
import { documentQueryKey } from './useDocumentFile'

export { AUTOSAVE_DELAY_MS } from '@/shared/hooks/useFileAutosave'

export interface AutosaveOptions {
  tabId: string
  relPath: string
  /** The document as it should be written now; `null` while there is nothing to save. */
  build: () => SoarDocument | null
  /** The version now on disk (as cached), after every successful save. */
  onSaved: (saved: SoarDocument) => void
}

/** Autosave of one document tab (`useFileAutosave` on `fs:write-document`). */
export function useAutosave({ tabId, relPath, build, onSaved }: AutosaveOptions): FileAutosave {
  return useFileAutosave({
    tabId,
    queryKey: documentQueryKey(relPath),
    write: (document) => ipcClient.fs.writeDocument(relPath, document),
    build,
    onSaved
  })
}
