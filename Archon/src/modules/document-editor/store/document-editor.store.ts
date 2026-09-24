import type { Editor } from '@tiptap/core'
import { create } from 'zustand'

/**
 * One open document, as the pieces rendered in other slots (toolbar,
 * inspector, status bar) need it. Keyed by tab id: those slots are not inside
 * the editor's React tree, so a context provider could not reach them.
 */
export interface DocumentSession {
  editor: Editor | null
  title: string
  tags: string[]
  linkedDiagrams: string[]
  words: number
  /** Marks the document changed (dirty + autosave). */
  changed: () => void
}

interface DocumentEditorState {
  sessions: Record<string, DocumentSession>
  open: (tabId: string, session: DocumentSession) => void
  patch: (tabId: string, patch: Partial<DocumentSession>) => void
  remove: (tabId: string) => void
}

export const useDocumentEditorStore = create<DocumentEditorState>()((set) => ({
  sessions: {},
  open: (tabId, session) => set((state) => ({ sessions: { ...state.sessions, [tabId]: session } })),
  patch: (tabId, patch) =>
    set((state) => {
      const current = state.sessions[tabId]
      if (!current) return state
      return { sessions: { ...state.sessions, [tabId]: { ...current, ...patch } } }
    }),
  remove: (tabId) =>
    set((state) => {
      if (!(tabId in state.sessions)) return state
      const sessions = { ...state.sessions }
      delete sessions[tabId]
      return { sessions }
    })
}))

export function useDocumentSession(tabId: string): DocumentSession | undefined {
  return useDocumentEditorStore((s) => s.sessions[tabId])
}
