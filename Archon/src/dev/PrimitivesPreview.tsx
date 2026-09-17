// Temporary visual check for the shared primitives (plan 02).
// Removed in plan 04, when App.tsx becomes the real shell.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, ICON_PATHS, type IconName } from '@/shared/components/icons'
import {
  Button,
  ControlPill,
  Divider,
  EmptyState,
  IconButton,
  Input,
  Kbd,
  Menu,
  MenuItem,
  SearchInput,
  SectionLabel,
  SegmentedControl,
  SplitButton,
  Swatch,
  TagInput,
  Textarea,
  Toggle
} from '@/shared/components/ui'
import { PreviewModal } from './PreviewModal'

const COLORS = ['#4F8EF7', '#22C55E', '#F59E0B', '#E8534F', '#A855F7', '#14B8A6']

function Row({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>{title}</SectionLabel>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  )
}

export function PrimitivesPreview(): React.JSX.Element {
  const [light, setLight] = useState(false)
  const [side, setSide] = useState<'files' | 'diagrams'>('files')
  const [target, setTarget] = useState('root')
  const [retry, setRetry] = useState(true)
  const [color, setColor] = useState(COLORS[0])
  const [tags, setTags] = useState(['enrichment', 't1566'])
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const exportRef = useRef<HTMLButtonElement>(null)

  // Portaled layers (menus, tooltips, modals) follow the root theme, so the
  // preview switches the whole document instead of rendering two panels.
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark'
  }, [light])

  return (
    <div className="mx-auto flex w-full max-w-[960px] min-w-0 flex-col gap-5 p-4 @container">
      <label className="flex items-center gap-2 text-[12px] text-fg-muted">
        <Toggle checked={light} onChange={setLight} label="Light theme" />
        Light theme
      </label>

      <Row title="Icons">
        {(Object.keys(ICON_PATHS) as IconName[]).map((name) => (
          <span key={name} title={name} className="text-fg-muted">
            <Icon name={name} />
          </span>
        ))}
      </Row>

      <Row title="Buttons">
        <Button variant="primary">Create diagram</Button>
        <Button variant="secondary">Cancel</Button>
        <Button
          ref={exportRef}
          variant="outline-accent"
          icon="download"
          onClick={() => setMenuOpen((o) => !o)}
        >
          Export
        </Button>
        <Button variant="danger-outline">Delete node</Button>
        <Button variant="ghost" size="sm" icon="folder">
          New folder
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Menu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchor={exportRef}
          placement="bottom-end"
          width={190}
          aria-label="Export formats"
        >
          <MenuItem suffix=".png">PNG</MenuItem>
          <MenuItem suffix=".svg">SVG</MenuItem>
          <MenuItem suffix=".pdf">PDF</MenuItem>
          <MenuItem suffix=".xmi" disabled>
            UML XMI
          </MenuItem>
          <MenuItem icon="trash" danger>
            Delete
          </MenuItem>
        </Menu>
      </Row>

      <Row title="Icon buttons & toolbar">
        <IconButton icon="cursor" label="Select (V)" active />
        <IconButton icon="hand" label="Pan (H)" />
        <IconButton icon="plusBox" label="Add node (N)" />
        <Divider />
        <ControlPill as="button">
          <span className="size-3 rounded-full" style={{ background: color }} /> Stroke
        </ControlPill>
        <ControlPill>
          <Icon name="weight" size={14} /> 1.5 <Icon name="chevD" size={11} />
        </ControlPill>
        <Divider />
        <IconButton icon="undo" label="Undo" />
        <IconButton icon="moon" label="Toggle theme" variant="outline" />
        <IconButton icon="gear" label="Settings" size="md" />
        <IconButton icon="plus" label="Zoom in" size="sm" />
        <IconButton icon="close" label="Close tab" size="xs" />
      </Row>

      <Row title="Split button & segmented">
        <SplitButton
          label="New"
          icon="plus"
          onPrimary={() => undefined}
          menuLabel="More create options"
          className="w-[236px]"
          menu={
            <>
              <MenuItem icon="flow">New diagram…</MenuItem>
              <MenuItem icon="file">New document</MenuItem>
              <MenuItem icon="folder">New folder</MenuItem>
            </>
          }
        />
        <SegmentedControl
          className="w-[236px]"
          aria-label="Sidebar view"
          value={side}
          onChange={setSide}
          options={[
            { value: 'files', label: 'Files', icon: 'folder' },
            { value: 'diagrams', label: 'Diagrams', icon: 'flow' }
          ]}
        />
        <SegmentedControl
          variant="pills"
          aria-label="Saves to"
          value={target}
          onChange={setTarget}
          options={['root', 'Playbooks', 'Runbooks'].map((value) => ({ value, label: value }))}
        />
      </Row>

      <Row title="Fields">
        <div className="grid w-full grid-cols-1 gap-2 @md:grid-cols-2">
          <Input defaultValue="Analyze Indicators" aria-label="Name" />
          <Input tone="muted" defaultValue="VirusTotal + URLScan" aria-label="Subtitle" />
          <SearchInput placeholder="Search files" />
          <TagInput
            tags={tags}
            onAdd={(tag) => setTags((t) => [...t, tag])}
            onRemove={(tag) => setTags((t) => t.filter((x) => x !== tag))}
          />
          <Textarea
            className="h-[74px] @md:col-span-2"
            defaultValue="Enrich URLs and hashes."
            aria-label="Description"
          />
        </div>
      </Row>

      <Row title="Toggle, swatches, kbd">
        <Toggle checked={retry} onChange={setRetry} label="Retry on fail" />
        {COLORS.map((c) => (
          <Swatch key={c} color={c} label={c} selected={c === color} onSelect={setColor} />
        ))}
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          Open modal <Kbd>⏎</Kbd>
        </Button>
      </Row>

      <EmptyState>
        Nothing selected.
        <br />
        Pick a node on the canvas, or use the Add Node tool to place one.
      </EmptyState>

      <PreviewModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
