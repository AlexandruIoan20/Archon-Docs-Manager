import { useEffect, useState } from 'react'
import { ipcClient } from '@/core/ipc/ipc-client'
import { Icon, type IconName } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

interface ControlButtonProps {
  icon: IconName
  label: string
  onClick: () => void
  danger?: boolean
}

function ControlButton({ icon, label, onClick, danger }: ControlButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'app-no-drag flex h-12 w-[46px] cursor-pointer items-center justify-center text-fg-muted transition-colors',
        danger ? 'hover:bg-danger hover:text-white' : 'hover:bg-surface-2 hover:text-fg'
      )}
    >
      <Icon name={icon} size={14} />
    </button>
  )
}

/**
 * Minimize / maximize-restore / close for Linux, where the window has no native
 * frame. Windows and macOS keep their OS-drawn controls.
 */
export function WindowControls(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let active = true
    void ipcClient.window.isMaximized().then((value) => {
      if (active) setMaximized(value)
    })
    const unsubscribe = ipcClient.on('window:maximized-changed', setMaximized)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex shrink-0 self-stretch" role="group" aria-label="Window controls">
      <ControlButton icon="winMinimize" label="Minimize" onClick={ipcClient.window.minimize} />
      <ControlButton
        icon={maximized ? 'winRestore' : 'winMaximize'}
        label={maximized ? 'Restore' : 'Maximize'}
        onClick={ipcClient.window.toggleMaximize}
      />
      <ControlButton icon="close" label="Close" onClick={ipcClient.window.close} danger />
    </div>
  )
}
