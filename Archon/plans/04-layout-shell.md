# 04 — Layout shell & contribuții de editor

## Scop
Scheletul complet al ferestrei din prototip, cu sloturi goale: TitleBar, tab bar, sidebar, zona centrală, properties panel și status bar.
Tot aici se definește mecanismul prin care modulele-editor se conectează la shell **fără să fie importate de acesta**.
Shell-ul este responsive: panourile se redimensionează, iar când lipsește spațiul devin overlay (vezi „Strategie responsive” în overview).

## Referință design
```
┌──────────────────────────── TitleBar 48 ────────────────────────────┐
├──────────────────────────── TabBar 36 (--side) ─────────────────────┤
│ Sidebar 260 (--side) │  Main (flex-1, --canvas)  │ Inspector 240    │
│ border-right         │                           │ (--surface)      │
│                      │                           │ border-left      │
├──────────────────────────── StatusBar 24 (--side) ──────────────────┤
└──────────────────────────────────────────────────────────────────────┘
```
- Main are `min-width: 0`, iar lățimile panourilor vin din variabilele `--size-sidebar` / `--size-inspector`, setate de shell din store.
- Inspector-ul are header 40 și se poate închide (butonul × din header și rotița din footer-ul sidebar-ului).

### Comportament responsive
- **Stări de panou:** `docked` (în grid, ca în prototip), `overlay` (sertar peste main) și `hidden`.
- **Regula de dispunere**, în `resolvePanelLayout`:
  1. inspector-ul e `docked` dacă `width ≥ sidebar + inspector + MAIN_MIN_WITH_INSPECTOR` (sidebar-ul contează doar dacă e vizibil);
  2. sidebar-ul e `docked` dacă `width ≥ sidebar + MAIN_MIN_WITH_SIDEBAR`;
  3. un panou vizibil care nu încape devine `overlay`, doar dacă utilizatorul l-a deschis explicit după ce spațiul l-a ascuns; altfel rămâne `hidden`.
  4. cele două overlay-uri se exclud: deschiderea unuia îl închide pe celălalt.
- **Overlay:**
  - poziționat absolut peste zona body (între tab bar și status bar), lipit de marginea lui, cu lățimea panoului, dar cel mult `100% - 48px`;
  - `box-shadow: var(--shadow-menu)`, fără scrim întunecat; click în main, `Escape` sau deschiderea unui fișier îl închide;
  - animație `transform: translateX` 150ms, dezactivată la `prefers-reduced-motion`;
  - focusul intră în panou la deschidere și revine la elementul anterior la închidere.
- **Redimensionare:** mâner de 1px vizibil (`--border`), zonă activă de 6px, cursor `col-resize`, highlight `--accent` la hover și drag.
  - limite: sidebar 200–420, inspector 220–380;
  - dublu-click → lățimea implicită;
  - `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow/min/max`; săgețile ←/→ mută cu 16px;
  - în timpul drag-ului: `user-select: none` pe body și cursorul forțat pe tot documentul;
  - doar panourile `docked` au mâner.
- **Înălțime:** zona body are `min-height: 0`; fiecare panou are scroll vertical propriu. La 480px înălțime rămân 372px utili.

## Dependențe
- Plan 03.
- npm: `zustand` (prima utilizare).

## Fișiere
- `src/core/types/editor.types.ts`:
  ```ts
  export type FileKind = 'soardoc' | 'soardiag'
  export interface EditorTabRef { tabId: string; filePath: string; kind: FileKind }
  export interface EditorSlotProps { tab: EditorTabRef }
  export interface EditorContribution {
    kind: FileKind
    Editor: ComponentType<EditorSlotProps>
    Toolbar?: ComponentType<EditorSlotProps>      // slot TitleBar stânga; citește useTitleBarDensity()
    TitleActions?: ComponentType<EditorSlotProps> // slot TitleBar dreapta (Export)
    Inspector?: ComponentType<EditorSlotProps>    // panoul din dreapta
    StatusItems?: ComponentType<EditorSlotProps>  // segmente în status bar
  }
  ```
- `src/core/types/layout.types.ts`: `PanelId = 'sidebar' | 'inspector'`, `PanelMode = 'docked' | 'overlay' | 'hidden'`, `PanelLayout`.
- `src/core/constants/layout.constants.ts` (modificat):
  - `SIDEBAR_WIDTH = { default: 260, min: 200, max: 420 }`, `INSPECTOR_WIDTH = { default: 240, min: 220, max: 380 }`;
  - `MAIN_MIN_WITH_INSPECTOR = 600`, `MAIN_MIN_WITH_SIDEBAR = 640`, `PANEL_RESIZE_STEP = 16`;
  - `INSPECTOR_AUTOHIDE_BREAKPOINT` se șterge (înlocuit de regula de mai sus), împreună cu referințele lui.
- `src/shared/utils/panel-layout.ts`: funcție pură `resolvePanelLayout({ width, sidebar, inspector }) → PanelLayout`. Intrarea are pentru fiecare panou `{ visible, width, overlayOpen }`, iar ieșirea `{ mode: PanelMode, width }`.
- `src/store/ui.store.ts`:
  - `panels: Record<PanelId, { visible: boolean; width: number; overlayOpen: boolean }>`;
  - `activeModal: ModalId | null`;
  - acțiunile `togglePanel(id, autoHidden)`, `setPanelWidth(id, w)` (cu clamp), `resetPanelWidth(id)`, `closeOverlays()`, `openModal`, `closeModal`.
- `src/store/index.ts`
- `src/core/types/ui.types.ts`: `ModalId` (union, extins de planurile următoare: `'new-diagram'`, `'confirm'`, `'command-palette'`).
- `src/core/editor/EditorContributionsProvider.tsx`: context, plus hook-ul `useEditorContribution(kind)`.
- `src/shared/hooks/useWindowSize.ts`: `{ width, height }` la `resize`, grupat pe `requestAnimationFrame`.
- `src/shared/hooks/usePanelLayout.ts`: combină `useWindowSize`, store-ul și `resolvePanelLayout`.
- `src/shared/components/layout/AppShell.tsx`: gridul cu sloturi (`titleBar`, `tabBar`, `sidebar`, `main`, `inspector`, `statusBar`), cu coloanele calculate din `PanelLayout`.
- `src/shared/components/layout/SidePanel.tsx`: containerul comun pentru `docked`/`overlay` (poziție, umbră, animație, focus, Escape). Are `container-type: inline-size`.
- `src/shared/components/layout/PanelResizeHandle.tsx`: generic (`value`, `min`, `max`, `step`, `onChange`, `onReset`, `edge: 'start' | 'end'`), cu pointer events prin `setPointerCapture` și tastatură. Nu știe de store; plan 18 îl refolosește pentru split view.
- `src/shared/components/layout/Sidebar.tsx`: folosește `SidePanel` (conținutul vine în plan 08).
- `src/shared/components/layout/InspectorPanel.tsx`: folosește `SidePanel`, cu header „Properties” și buton de închidere.
- `src/shared/components/layout/StatusBar.tsx`: containerul de 24px (conținutul vine în plan 06).
- `src/shared/components/layout/ModalHost.tsx`: primește `modals: Partial<Record<ModalId, ComponentType>>` și randează modalul activ.
- `src/App.tsx` (rescris): compune shell-ul. E **singurul** fișier care importă din mai multe module.

## Pași
1. `npm i -D zustand` (bundled în renderer).
2. `editor.types.ts`, `layout.types.ts`, `ui.types.ts` și constantele de layout.
3. `panel-layout.ts`, cu teste **înaintea** componentelor:
   - 1440 cu lățimi implicite → ambele `docked`;
   - 1099 → inspector `hidden`, sidebar `docked`; 899 → ambele `hidden`;
   - sidebar lărgit la 420 → inspector-ul se ascunde de la 1260;
   - sidebar ascuns de utilizator → inspector-ul rămâne `docked` până la 840;
   - `overlayOpen` pe un panou care încape → `docked`, fără overlay;
   - două overlay-uri cerute → rămâne doar ultimul.
4. `ui.store.ts`, cu selectori granulari (`useUiStore(s => s.panels.inspector)`), fără selectarea întregului store.
   `togglePanel` pe un panou ascuns de spațiu comută `overlayOpen`, nu `visible`, ca preferința utilizatorului să nu se piardă.
   Test pentru acțiuni și pentru clamp-ul lățimilor.
5. `EditorContributionsProvider`:
   - primește `contributions: EditorContribution[]`;
   - construiește un `Map<FileKind, EditorContribution>`;
   - aruncă eroare la `kind` duplicat.

   Test pentru lookup și duplicat.
6. `useWindowSize` și `usePanelLayout`.
7. `AppShell` cu CSS grid: `grid-template-columns: [sidebar] var(--size-sidebar) [main] minmax(0, 1fr) [inspector] var(--size-inspector)`, cu coloana de 0 pentru panourile care nu sunt `docked`.
   Variabilele `--size-*` se setează inline pe shell din `PanelLayout`.
   Zona body are `position: relative` (pentru overlay) și `min-height: 0`, ca scroll-ul intern să funcționeze.
8. `SidePanel` și `PanelResizeHandle`.
   Lățimea se actualizează în store pe `pointermove`, grupat pe `requestAnimationFrame`.
9. `Sidebar`, `InspectorPanel` (header 40: „Properties” 12px 600 letter-spacing .4px + `IconButton` close), `StatusBar` (padding 0 12, gap 14, 11px text2).
10. `ModalHost`.
11. `App.tsx`: randează `AppShell` cu placeholdere text în fiecare slot. Șterge pagina de verificare din plan 02.
12. Shortcut-uri de bază, direct cu `keydown` în `App.tsx` (se mută în registrul din plan 20):
    - `Ctrl/Cmd+B` → sidebar;
    - `Ctrl/Cmd+Alt+B` → inspector.

    Ambele trec prin `togglePanel`, deci deschid overlay-ul când panoul nu încape.
13. Teste de componente:
    - `AppShell`: sloturile apar, iar inspector-ul lipsește când nu e vizibil;
    - `SidePanel` în `overlay`: Escape și click în main îl închid;
    - `PanelResizeHandle`: săgețile schimbă lățimea cu 16px, respectând limitele; dublu-click resetează.

## Criterii de acceptare
- Layout-ul corespunde vizual prototipului la 1440×900.
- Trece matricea de verificare responsive din overview: la 1093×570 inspector-ul e ascuns și se deschide ca overlay cu `Ctrl+Alt+B`; la 720×480 ambele panouri se deschid ca overlay, pe rând.
- Redimensionarea ferestrei sub prag ascunde panoul, iar peste prag îl readuce doar dacă utilizatorul nu l-a închis.
- Panourile se pot redimensiona cu mouse-ul și cu tastatura, în limite, fără sacadări.
- Zona centrală nu scade niciodată sub 600px cu inspector-ul fix și nu apare scroll orizontal pe fereastră.
- `src/shared/**` nu importă din `src/modules/**` (verificare cu grep; opțional, regulă ESLint `no-restricted-imports` adăugată acum).

## Commit
`feat(layout): responsive app shell, ui store and editor contribution registry`

## În afara scopului
- Conținutul sidebar-ului, tab-urile, status bar-ul, editoarele.
- Persistența lățimilor și a vizibilității (plan 05).
