import { useUiStore } from '@/store'

/** Copies text to the system clipboard and confirms it with a toast. */
export async function copyText(text: string, confirmation = 'Copied'): Promise<boolean> {
  const { notify } = useUiStore.getState()
  try {
    await navigator.clipboard.writeText(text)
    notify(confirmation)
    return true
  } catch {
    notify('Could not copy to the clipboard', 'error')
    return false
  }
}
