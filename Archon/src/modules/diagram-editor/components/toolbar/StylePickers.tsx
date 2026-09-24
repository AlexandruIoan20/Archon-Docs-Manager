import { useState, type KeyboardEvent } from 'react'
import { Swatch } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import { NODE_PALETTE } from '../../constants/node-palette'
import { FONT_SIZE, STROKE_WIDTHS } from '../../constants/style'

export function StrokePicker({
  value,
  onChange
}: {
  value: string
  onChange: (color: string) => void
}): React.JSX.Element {
  return (
    <div role="group" aria-label="Stroke color" className="flex flex-wrap gap-2">
      {NODE_PALETTE.map((color) => (
        <Swatch
          key={color.value}
          color={color.value}
          label={color.name}
          selected={color.value.toLowerCase() === value.toLowerCase()}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}

export function FillPicker({
  value,
  onChange
}: {
  value: string | null
  onChange: (color: string | null) => void
}): React.JSX.Element {
  return (
    <div role="group" aria-label="Fill color" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          'h-[22px] cursor-pointer rounded-full border px-2 text-[11px]',
          value === null ? 'border-accent text-accent' : 'border-border text-fg-muted'
        )}
      >
        None
      </button>
      {NODE_PALETTE.map((color) => (
        <Swatch
          key={color.value}
          color={color.value}
          label={`${color.name} fill`}
          selected={color.value.toLowerCase() === value?.toLowerCase()}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}

export function WeightPicker({
  value,
  onChange
}: {
  value: number
  onChange: (width: number) => void
}): React.JSX.Element {
  return (
    <div role="group" aria-label="Stroke weight" className="flex gap-1">
      {STROKE_WIDTHS.map((width) => (
        <button
          key={width}
          type="button"
          aria-pressed={width === value}
          onClick={() => onChange(width)}
          className={cn(
            'h-7 min-w-9 cursor-pointer rounded-sm px-2 font-mono text-[11px]',
            width === value ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-surface-2'
          )}
        >
          {width}
        </button>
      ))}
    </div>
  )
}

/** Font size in px, applied on Enter or blur and kept within 8–72. */
export function FontSizeInput({
  value,
  onChange
}: {
  value: number
  onChange: (size: number) => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (): void => {
    if (draft === null) return
    const size = Math.round(Number(draft))
    setDraft(null)
    if (!Number.isFinite(size) || draft.trim() === '') return
    onChange(Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, size)))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      setDraft(null)
    }
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="Font size"
      value={draft ?? String(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className="h-5 w-[26px] rounded-xs bg-transparent text-center font-mono text-[11px] text-fg outline-none focus:bg-bg"
    />
  )
}
