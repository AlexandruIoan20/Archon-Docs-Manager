import { useEffect } from 'react'
import { useUiStore } from '@/store'
import { Toast } from '@/shared/components/ui'

export const TOAST_DURATION_MS = 1900

/**
 * Shows `ui.store.toast` above the status bar. The live region stays mounted
 * so screen readers announce each new message; a new toast restarts the timer.
 */
export function ToastViewport(): React.JSX.Element {
  const toast = useUiStore((s) => s.toast)
  const dismissToast = useUiStore((s) => s.dismissToast)
  const toastId = toast?.id

  useEffect(() => {
    if (toastId === undefined) return
    const timer = window.setTimeout(dismissToast, TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toastId, dismissToast])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-11 z-[60] flex justify-center px-4"
    >
      {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} />}
    </div>
  )
}
