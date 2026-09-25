import type { Ref } from 'react'

export interface LineNumbersProps {
  count: number
  errorLine: number | null
  ref?: Ref<HTMLDivElement>
}

/** The line numbers beside the source; scrolled with the text area (`MermaidSourcePane`). */
export function LineNumbers({ count, errorLine, ref }: LineNumbersProps): React.JSX.Element {
  return (
    <div
      ref={ref}
      aria-hidden
      className="shrink-0 overflow-hidden border-r border-border py-4 pr-2.5 pl-3 text-right font-mono text-[12px] leading-[1.6] text-fg-subtle select-none"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={i + 1 === errorLine ? 'text-danger' : undefined}>
          {i + 1}
        </div>
      ))}
    </div>
  )
}
