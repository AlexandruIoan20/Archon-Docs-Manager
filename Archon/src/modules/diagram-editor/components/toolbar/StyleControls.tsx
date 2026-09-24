import { useRef, useState, type ReactNode, type RefObject } from 'react'
import { Icon } from '@/shared/components/icons'
import { ControlPill } from '@/shared/components/ui'
import { hexToRgba } from '@/shared/utils/color'
import { cn } from '@/shared/utils/cn'
import { useDiagramStore } from '../../store/DiagramStoreProvider'
import { FillPicker, FontSizeInput, StrokePicker, WeightPicker } from './StylePickers'
import { ToolbarPopover } from './ToolbarPopover'
import { useStyleValues } from './useStyleValues'

export interface StyleControlsProps {
  /** `inline` in the title bar; `stacked` inside the „Style” popover (compact / minimal). */
  layout: 'inline' | 'stacked'
}

type Picker = 'stroke' | 'fill' | 'weight'

export function ColorDot({
  color,
  empty
}: {
  color: string | null
  empty?: boolean
}): React.JSX.Element {
  return (
    <span
      aria-hidden
      style={{ background: color && !empty ? color : 'var(--surface)' }}
      className={cn(
        'inline-block size-3 rounded-full',
        empty ? 'shadow-[0_0_0_1.5px_var(--text3)]' : 'shadow-[0_0_0_1.5px_var(--accent-border)]'
      )}
    />
  )
}

function Row({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium tracking-[.3px] text-fg-muted uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

/** STROKE / FILL / weight / font size of the selected shapes, text and edges. */
export function StyleControls({ layout }: StyleControlsProps): React.JSX.Element {
  const values = useStyleValues()
  const applyStyle = useDiagramStore((s) => s.applyStyle)
  const [open, setOpen] = useState<Picker | null>(null)
  const refs = {
    stroke: useRef<HTMLButtonElement>(null),
    fill: useRef<HTMLButtonElement>(null),
    weight: useRef<HTMLButtonElement>(null)
  } satisfies Record<Picker, RefObject<HTMLButtonElement | null>>

  const pickers: Record<Picker, ReactNode> = {
    stroke: <StrokePicker value={values.stroke} onChange={(stroke) => applyStyle({ stroke })} />,
    fill: <FillPicker value={values.fill} onChange={(fill) => applyStyle({ fill })} />,
    weight: (
      <WeightPicker
        value={values.strokeWidth}
        onChange={(strokeWidth) => applyStyle({ strokeWidth })}
      />
    )
  }
  const fontSize = (
    <FontSizeInput value={values.fontSize} onChange={(size) => applyStyle({ fontSize: size })} />
  )

  if (layout === 'stacked') {
    return (
      <div className="flex w-[232px] flex-col gap-3">
        <Row label="Stroke">{pickers.stroke}</Row>
        <Row label="Fill">{pickers.fill}</Row>
        <Row label="Weight">{pickers.weight}</Row>
        <Row label="Font size">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-sm border border-border px-2 py-1 text-[11px] text-fg-muted">
            Aa {fontSize}
          </span>
        </Row>
      </div>
    )
  }

  const pill = (id: Picker, label: string, content: ReactNode): React.JSX.Element => (
    <>
      <ControlPill
        as="button"
        ref={refs[id]}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open === id}
        onClick={() => setOpen((current) => (current === id ? null : id))}
      >
        {content}
      </ControlPill>
      <ToolbarPopover
        open={open === id}
        onClose={() => setOpen(null)}
        anchorRef={refs[id]}
        label={label}
      >
        {pickers[id]}
      </ToolbarPopover>
    </>
  )

  return (
    <div className="flex items-center gap-2">
      {pill(
        'stroke',
        'Stroke color',
        <>
          Stroke <ColorDot color={values.stroke} />
        </>
      )}
      {pill(
        'fill',
        'Fill color',
        <>
          Fill <ColorDot color={values.fill && hexToRgba(values.fill, 0.16)} empty={!values.fill} />
        </>
      )}
      {pill(
        'weight',
        'Stroke weight',
        <>
          <Icon name="weight" size={13} />
          <span className="font-mono normal-case">{values.strokeWidth}</span>
          <Icon name="chevD" size={11} />
        </>
      )}
      <ControlPill>
        {/* The pill is uppercase; „Aa” shows the case it stands for. */}
        <span className="normal-case">Aa</span> {fontSize}
      </ControlPill>
    </div>
  )
}
