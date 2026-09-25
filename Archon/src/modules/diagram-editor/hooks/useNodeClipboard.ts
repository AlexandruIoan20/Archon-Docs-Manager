import { useRef } from 'react'
import type { XYPosition } from '@xyflow/react'
import { useUiStore } from '@/store'
import type { DiagramStoreApi } from '../store/diagram.store'
import {
  copySelection,
  parseClipboard,
  pasteGraph,
  PASTE_OFFSET,
  serializeClipboard,
  type NodeClipboard
} from '../utils/clipboard'

// Also kept here: the system clipboard may be unavailable or hold other text.
let lastCopied: NodeClipboard | null = null

async function readPayload(): Promise<NodeClipboard | null> {
  try {
    const text = await navigator.clipboard?.readText()
    const parsed = text ? parseClipboard(text) : null
    if (parsed) return parsed
  } catch {
    // Denied or unsupported: fall back to the last copy of this session.
  }
  return lastCopied
}

export interface NodeClipboardActions {
  copy: () => Promise<boolean>
  /** At `at` (context menu), else 24px further on at every paste of the same copy. */
  paste: (at?: XYPosition) => Promise<boolean>
  duplicate: () => void
}

/** Ctrl/Cmd+C, V and D on the canvas: each paste is one undo step. */
export function useNodeClipboard(store: DiagramStoreApi | null): NodeClipboardActions {
  const pastes = useRef({ source: null as string | null, count: 0 })
  const notify = (message: string): void => useUiStore.getState().notify(message)

  const insert = (
    payload: NodeClipboard,
    placement: { offset?: number; at?: XYPosition }
  ): void => {
    if (!store) return
    const state = store.getState()
    const { nodes, edges } = pasteGraph(payload, state.nodes, state.edges, placement)
    state.insertElements(nodes, edges)
  }

  const copy = async (): Promise<boolean> => {
    if (!store) return false
    const { nodes, edges } = store.getState()
    const payload = copySelection(nodes, edges)
    if (!payload) return false
    lastCopied = payload
    pastes.current = { source: serializeClipboard(payload), count: 0 }
    try {
      await navigator.clipboard?.writeText(serializeClipboard(payload))
    } catch {
      // The in-app copy still works.
    }
    notify(payload.nodes.length === 1 ? 'Node copied' : `${payload.nodes.length} nodes copied`)
    return true
  }

  const paste = async (at?: XYPosition): Promise<boolean> => {
    const payload = await readPayload()
    if (!payload || !store) return false
    const key = serializeClipboard(payload)
    if (pastes.current.source !== key) pastes.current = { source: key, count: 0 }
    pastes.current.count += 1
    insert(payload, at ? { at } : { offset: PASTE_OFFSET * pastes.current.count })
    return true
  }

  const duplicate = (): void => {
    if (!store) return
    const { nodes, edges } = store.getState()
    const payload = copySelection(nodes, edges)
    if (payload) insert(payload, { offset: PASTE_OFFSET })
  }

  return { copy, paste, duplicate }
}
