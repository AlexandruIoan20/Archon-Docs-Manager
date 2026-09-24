import { useRef, useState } from 'react'
import { Icon } from '@/shared/components/icons'
import { ControlPill } from '@/shared/components/ui'
import { ColorDot, StyleControls } from './StyleControls'
import { ToolbarPopover } from './ToolbarPopover'
import { useStyleValues } from './useStyleValues'

/** The „Style” pill of the compact and minimal title bars: all controls in a popover. */
export function StylePopover(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const { stroke } = useStyleValues()

  return (
    <>
      <ControlPill
        as="button"
        ref={anchorRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ColorDot color={stroke} />
        Style
        <Icon name="chevD" size={11} />
      </ControlPill>
      <ToolbarPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        label="Style"
      >
        <StyleControls layout="stacked" />
      </ToolbarPopover>
    </>
  )
}
