# 02 — Primitive UI partajate

## Scop
Extragerea tuturor controalelor repetate din prototip în componente reutilizabile din `src/shared/components/ui/` și în registrul de iconițe.
Planurile următoare **compun** aceste primitive și nu mai scriu stiluri de buton sau de input de la zero.

## Referință design (inventarul controalelor din prototip)

| Primitivă | Variante observate în prototip |
|---|---|
| `Icon` | ~27 path-uri: zap, search, branch, shield, alert, file, box, folder, flow, chevD, chevR, cursor, hand, plusBox, link, text, rect, circle, trash, moon, sun, grid4, layers, play, plus, close, download, undo, redo, gear, more, check, weight. Stroke 1.5 implicit, 1.8–2.4 la chevron-uri/close |
| `IconButton` | toolbar 30×30 r4 (activ: fundal `accent-soft` + inset 1px `accent-border` + culoare accent); mic 28×28 (search/gear); mini 24×24 (zoom); micro 16–20 (close tab, close panel) |
| `Button` | `primary` (fundal accent, text on-accent, 600); `outline-accent` (Export: border accent-border, text accent); `secondary` (border, text2); `danger-outline` (Delete node: border, text #DC2626); `ghost` (item de meniu, h28). Înălțimi 28/30 |
| `SplitButton` | „New” + chevron: două butoane lipite, raze 4 0 0 4 / 0 4 4 0, chevronul cu `filter: brightness(.88)` |
| `Chip` / `ControlPill` | h28, padding 0 8, border, fundal surface2, etichetă uppercase 11px 500 text2 (STROKE / FILL / greutate / Aa) |
| `Input` | h30 r4, fundal bg, border, padding 0 9, 13px (name) sau 12px text2 (subtitle) |
| `SearchInput` | h28 r4, fundal surface2, border, iconiță search 13px text3, input transparent 12px |
| `Textarea` | fundal bg, border r4, padding 8 9, 12px, line-height 1.5, fără resize |
| `Toggle` | track 30×17 r9 (on: accent, off: border), knob 13×13 fundal bg, `transition: left .15s` |
| `SegmentedControl` | Files/Diagrams: butoane flex-1 h28 r4, activ fundal surface + text; „saves to”: container surface2 border p2, opțiuni h22 r3 11px, activ accent-soft + accent-text |
| `Swatch` | cerc 22px, selectat: `0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)` |
| `TagInput` | container min-h30, fundal bg, border r4, p 5 6, wrap gap 5; tag h20 r4 accent-soft/accent-text 11px cu × 9px; input inline 11px „Add tag…” |
| `Menu` / `MenuItem` | popover fundal surface, border, r6–8, p4–5, shadow-menu; item h28 p0 8 r4 12px; sufix mono 10px text3 (extensie) |
| `Modal` | overlay absolut, închidere la mousedown pe fundal, conținut r8 fundal bg border shadow-modal |
| `Divider` | vertical 1×22 border (în toolbar) |
| `Kbd` | mono 10px opacity .65 (⏎) |
| `SectionLabel` | 11px 500 text2 uppercase letter-spacing .3px mb6 (NAME, COLOR…) |
| `EmptyState` | text centrat 12px text3, line-height 1.6 |
| `Tooltip` | `title` în prototip; noi facem tooltip propriu, cu delay |

## Dependențe
- Plan 01.
- Fără pachete npm noi.
- `clsx`/`tailwind-merge` nu sunt necesare: un helper local `cn()` e suficient.

## Fișiere
- `src/shared/utils/cn.ts`: concatenare de clase cu filtrare pe falsy.
- `src/shared/components/icons/icon-paths.ts`: `ICON_PATHS` (`Record<IconName, readonly string[]>`), plus `IconName` ca union derivat cu `keyof typeof`.
- `src/shared/components/icons/Icon.tsx`: props `name`, `size`, `strokeWidth`, `className`. Culoarea vine din `currentColor`.
- `src/shared/components/icons/index.ts`
- `src/shared/components/ui/`:
  - `Button.tsx`, `IconButton.tsx`, `SplitButton.tsx`, `ControlPill.tsx`
  - `Input.tsx`, `SearchInput.tsx`, `Textarea.tsx`
  - `Toggle.tsx`, `SegmentedControl.tsx`, `Swatch.tsx`, `TagInput.tsx`
  - `Menu.tsx` (`Menu` + `MenuItem`), `Modal.tsx`, `Tooltip.tsx`
  - `Divider.tsx`, `Kbd.tsx`, `SectionLabel.tsx`, `EmptyState.tsx`
  - `index.ts`
- `src/shared/hooks/useClickOutside.ts`: închide meniuri și popover-e.
- `src/shared/hooks/useEscape.ts`
- Teste colocate: `*.test.tsx` pentru `Toggle`, `SegmentedControl`, `TagInput`, `Menu`, `Modal`.

## Pași
1. `cn.ts` și testul lui.
2. **Registrul de iconițe.**
   Copiază path-urile din `PATHS` (prototip), plus iconițele desenate inline în template: close, plus, download, undo, redo, gear, more (3 puncte), check, weight (3 linii de grosimi diferite).
   `Icon` randează `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">`.
   Pentru iconițele cu stroke-uri diferite pe path (weight), path-ul se declară ca obiect `{ d, strokeWidth }`.
3. `Button` cu prop `variant: 'primary' | 'secondary' | 'outline-accent' | 'danger-outline' | 'ghost'` și `size: 'sm' | 'md'` (h28 / h30).
   Stilurile de variantă se țin într-un map constant, nu în condiții inline.
4. `IconButton` cu `size: 'xs' | 'sm' | 'md' | 'lg'` (20 / 24 / 28 / 30), `active?: boolean` și `label` **obligatoriu**.
   `label` devine `aria-label` și tooltip, pentru accesibilitate.
5. `SplitButton`: `onPrimary`, `menu` (ReactNode), deschide `Menu` sub buton.
6. `ControlPill`: container pentru controalele din toolbar, cu `as="button" | "div"`.
7. `Input`, `SearchInput`, `Textarea`: controlate, cu `forwardRef` (React 19: `ref` ca prop) și `tone: 'default' | 'muted'`.
8. `Toggle`: `role="switch"`, `aria-checked`. Test: click comută, Space comută.
9. `SegmentedControl<T extends string>` generic: `options: { value: T; label: ReactNode; icon?: IconName }[]`, `variant: 'tabs' | 'pills'`.
   Folosește `role="tablist"` / `role="radio"` și navigare cu săgeți.
10. `Swatch`: `color`, `selected`, `onSelect`, `aria-label` cu numele culorii.
11. `TagInput`: `tags`, `onAdd`, `onRemove`.
    Enter adaugă (trim, fără duplicate), Backspace pe input gol șterge ultimul tag.
    Test pentru ambele comportamente.
12. `Menu`: poziționat relativ la un anchor, se închide la click-outside și Escape, cu navigare cu săgeți.
    Randat prin portal în `document.body`, ca să nu fie tăiat de `overflow: hidden`.
    `MenuItem` are `icon?`, `suffix?` (mono), `danger?`.
13. `Modal`: portal, overlay `--overlay` + blur, închidere la mousedown pe overlay și la Escape, focus trap, `aria-modal`.
    Mărimea vine prin props (`width`, `height`), nu fixă.
14. `Tooltip`: apare după 500ms, poziționat sub element, randat prin portal.
15. `Divider`, `Kbd`, `SectionLabel`, `EmptyState`.
16. `index.ts` re-exportă tot. Nicio primitivă nu importă din `modules/` sau `store/`.
17. Pagina temporară de verificare: în `App.tsx` provizoriu, randează câte o instanță din fiecare primitivă, pe ambele teme.
    Se șterge în plan 04.

## Criterii de acceptare
- Fiecare primitivă sub 200 de linii, cu props tipate prin interfețe dedicate.
- Toate controalele sunt operabile doar din tastatură, cu inel de focus vizibil.
- Testele pentru Toggle, Segmented, TagInput, Menu și Modal trec.
- Vizual, controalele corespund prototipului în ambele teme.

## Commit
`feat(shared-ui): icon registry and base UI primitives`

## În afara scopului
- `ContextMenu` (click dreapta), care intră în plan 20 și reutilizează `Menu`.
- `Toast` (plan 06).
