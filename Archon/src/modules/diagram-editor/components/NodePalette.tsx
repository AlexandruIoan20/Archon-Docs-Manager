import { useRef, useState } from 'react'
import { IconButton, Menu, MenuItem } from '@/shared/components/ui'
import { Icon } from '@/shared/components/icons'
import { NODE_KINDS } from '../constants/node-kinds'
import { PLACEABLE_KINDS, TOOLS, type ToolDef } from '../constants/tools'
import { useDiagramStore } from '../store/DiagramStoreProvider'

const tip = (tool: ToolDef): string => `${tool.label} (${tool.shortcut})`

/** Add node, with a chevron that picks what it places (Action by default). */
function AddNodeButton({ tool }: { tool: ToolDef }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const active = useDiagramStore((s) => s.tool === 'node')
  const nodeKind = useDiagramStore((s) => s.nodeKind)
  const setTool = useDiagramStore((s) => s.setTool)
  const setNodeKind = useDiagramStore((s) => s.setNodeKind)

  return (
    <div className="flex items-center">
      <IconButton
        icon={tool.icon}
        label={`${tip(tool)}: ${NODE_KINDS[nodeKind].label}`}
        active={active}
        onClick={() => setTool('node')}
      />
      <button
        ref={anchorRef}
        type="button"
        aria-label="Node type"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-[30px] w-3.5 cursor-pointer items-center justify-center rounded-sm text-fg-subtle hover:text-fg"
      >
        <Icon name="chevD" size={10} />
      </button>
      <Menu open={open} onClose={() => setOpen(false)} anchor={anchorRef} aria-label="Node type">
        {PLACEABLE_KINDS.map((kind) => (
          <MenuItem
            key={kind}
            icon={NODE_KINDS[kind].defaultIcon}
            suffix={kind === nodeKind ? <Icon name="check" size={12} /> : undefined}
            onSelect={() => {
              setNodeKind(kind)
              setTool('node')
            }}
          >
            {NODE_KINDS[kind].label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

/** Secondary tools folded into „⋯” (minimal title bar); shows the active one's icon. */
function MoreTools({ tools }: { tools: readonly ToolDef[] }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const tool = useDiagramStore((s) => s.tool)
  const setTool = useDiagramStore((s) => s.setTool)
  const current = tools.find((t) => t.id === tool)

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon={current?.icon ?? 'more'}
        label="More tools"
        active={current !== undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      />
      <Menu open={open} onClose={() => setOpen(false)} anchor={anchorRef} aria-label="More tools">
        {tools.map((t) => (
          <MenuItem key={t.id} icon={t.icon} suffix={t.shortcut} onSelect={() => setTool(t.id)}>
            {t.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

/** The seven canvas tools; `minimal` keeps the primary four and folds the rest. */
export function NodePalette({ minimal = false }: { minimal?: boolean }): React.JSX.Element {
  const tool = useDiagramStore((s) => s.tool)
  const setTool = useDiagramStore((s) => s.setTool)
  const shown = minimal ? TOOLS.filter((t) => t.priority === 'primary') : TOOLS
  const folded = minimal ? TOOLS.filter((t) => t.priority === 'secondary') : []

  return (
    <div role="toolbar" aria-label="Canvas tools" className="flex items-center gap-0.5">
      {shown.map((t) =>
        t.id === 'node' ? (
          <AddNodeButton key={t.id} tool={t} />
        ) : (
          <IconButton
            key={t.id}
            icon={t.icon}
            label={tip(t)}
            active={tool === t.id}
            onClick={() => setTool(t.id)}
          />
        )
      )}
      {folded.length > 0 && <MoreTools tools={folded} />}
    </div>
  )
}
