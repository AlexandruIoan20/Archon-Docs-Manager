import { useId } from 'react'
import { Swatch } from '@/shared/components/ui'
import { NODE_PALETTE } from '../../constants/node-palette'
import { Field } from './Field'

export interface ColorFieldProps {
  /** The current color, or `null` when the selected nodes differ. */
  value: string | null
  onChange: (color: string) => void
}

/** The six semantic colors; they wrap on a narrow panel. */
export function ColorField({ value, onChange }: ColorFieldProps): React.JSX.Element {
  const labelId = useId()
  const current = value?.toLowerCase()
  return (
    <Field label="Color" labelId={labelId}>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-[7px] p-[3.5px]">
        {NODE_PALETTE.map(({ value: color, name }) => (
          <Swatch
            key={color}
            color={color}
            label={name}
            selected={current === color.toLowerCase()}
            onSelect={onChange}
          />
        ))}
      </div>
    </Field>
  )
}
