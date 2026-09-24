import type { SideTab } from '@/store'
import { SegmentedControl, type SegmentedOption } from '@/shared/components/ui'

export interface SidebarTabsProps {
  value: SideTab
  onChange: (tab: SideTab) => void
}

// Below 240px the sidebar keeps only the icons; the label stays for screen readers.
const label = (text: string): React.JSX.Element => (
  <span className="@max-[239px]:sr-only">{text}</span>
)

const OPTIONS: readonly SegmentedOption<SideTab>[] = [
  { value: 'files', label: label('Files'), icon: 'folder', tooltip: 'Files', ariaLabel: 'Files' },
  {
    value: 'diagrams',
    label: label('Diagrams'),
    icon: 'flow',
    tooltip: 'Diagrams only',
    ariaLabel: 'Diagrams'
  }
]

export function SidebarTabs({ value, onChange }: SidebarTabsProps): React.JSX.Element {
  return (
    <div className="px-3 pt-2.5 pb-2">
      <SegmentedControl
        options={OPTIONS}
        value={value}
        onChange={onChange}
        aria-label="Show in the tree"
      />
    </div>
  )
}
