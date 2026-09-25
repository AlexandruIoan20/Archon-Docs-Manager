import { useRef, type KeyboardEvent } from 'react'
import { LineNumbers } from './LineNumbers'

export interface MermaidSourcePaneProps {
  value: string
  onChange: (value: string) => void
  errorLine: number | null
}

const INDENT = '  '

/** Inserts text at the caret as typing would, so the text area's own undo keeps it. */
function insertText(area: HTMLTextAreaElement, text: string, onChange: (v: string) => void): void {
  if (document.execCommand?.('insertText', false, text)) return
  const { selectionStart, selectionEnd, value } = area
  const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
  onChange(next)
  requestAnimationFrame(() => {
    area.selectionStart = area.selectionEnd = selectionStart + text.length
  })
}

/** The Mermaid source: a mono text area with line numbers; Tab indents by 2 spaces. */
export function MermaidSourcePane({
  value,
  onChange,
  errorLine
}: MermaidSourcePaneProps): React.JSX.Element {
  const numbersRef = useRef<HTMLDivElement>(null)
  const lines = value.split('\n').length

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Tab' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
      return
    }
    event.preventDefault()
    insertText(event.currentTarget, INDENT, onChange)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 bg-bg">
      <LineNumbers ref={numbersRef} count={lines} errorLine={errorLine} />
      <textarea
        aria-label="Mermaid source"
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        wrap="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          if (numbersRef.current) numbersRef.current.scrollTop = event.currentTarget.scrollTop
        }}
        className="min-h-0 min-w-0 flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-[1.6] text-fg outline-none placeholder:text-fg-subtle"
        placeholder="sequenceDiagram"
      />
    </div>
  )
}
