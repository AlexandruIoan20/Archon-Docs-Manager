# 04 — Layout shell & contribuții de editor

## Scop
Scheletul complet al ferestrei din prototip, cu sloturi goale: TitleBar, tab bar, sidebar, zona centrală, properties panel și status bar.
Tot aici se definește mecanismul prin care modulele-editor se conectează la shell **fără să fie importate de acesta**.

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
- Toate panourile au `min-width` egal cu lățimea lor, iar main are `min-width: 0`.
- Inspector-ul are header 40 și se poate închide (butonul × din header și rotița din footer-ul sidebar-ului).

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
    Toolbar?: ComponentType<EditorSlotProps>      // slot TitleBar stânga
    TitleActions?: ComponentType<EditorSlotProps> // slot TitleBar dreapta (Export)
    Inspector?: ComponentType<EditorSlotProps>    // panoul din dreapta
    StatusItems?: ComponentType<EditorSlotProps>  // segmente în status bar
  }
  ```
- `src/core/editor/EditorContributionsProvider.tsx`: context, plus hook-ul `useEditorContribution(kind)`.
- `src/store/ui.store.ts`: `sidebarVisible`, `inspectorVisible`, `inspectorAutoHidden`, `activeModal: ModalId | null`, cu acțiunile aferente.
- `src/store/index.ts`
- `src/core/types/ui.types.ts`: `ModalId` (union, extins de planurile următoare: `'new-diagram'`, `'confirm'`, `'command-palette'`).
- `src/shared/components/layout/AppShell.tsx`: gridul cu sloturi (`titleBar`, `tabBar`, `sidebar`, `main`, `inspector`, `statusBar`).
- `src/shared/components/layout/Sidebar.tsx`: containerul de 260px (conținutul vine în plan 08).
- `src/shared/components/layout/InspectorPanel.tsx`: containerul de 240px, cu header „Properties” și buton de închidere.
- `src/shared/components/layout/StatusBar.tsx`: containerul de 24px (conținutul vine în plan 06).
- `src/shared/components/layout/ModalHost.tsx`: primește `modals: Partial<Record<ModalId, ComponentType>>` și randează modalul activ.
- `src/shared/hooks/useWindowWidth.ts`
- `src/App.tsx` (rescris): compune shell-ul. E **singurul** fișier care importă din mai multe module.

## Pași
1. `npm i -D zustand` (bundled în renderer).
2. `editor.types.ts` și `ui.types.ts`.
3. `ui.store.ts` cu acțiunile `toggleSidebar`, `toggleInspector`, `setInspectorAutoHidden`, `openModal`, `closeModal`.
   Selectori granulari (`useUiStore(s => s.inspectorVisible)`), fără selectarea întregului store.
   Test pentru reducerii de stare.
4. `EditorContributionsProvider`:
   - primește `contributions: EditorContribution[]`;
   - construiește un `Map<FileKind, EditorContribution>`;
   - aruncă eroare la `kind` duplicat.

   Test pentru lookup și duplicat.
5. `AppShell` cu CSS grid/flex și dimensiunile din tokenuri (`--size-*`).
   Zona body are `min-height: 0`, ca scroll-ul intern să funcționeze.
6. `Sidebar`, `InspectorPanel` (header 40: „Properties” 12px 600 letter-spacing .4px + `IconButton` close), `StatusBar` (padding 0 12, gap 14, 11px text2).
7. **Auto-hide inspector:** `useWindowWidth` + efect în `App.tsx`.
   Sub `INSPECTOR_AUTOHIDE_BREAKPOINT`, setează `inspectorAutoHidden`.
   Vizibilitatea efectivă este `inspectorVisible && !inspectorAutoHidden`, așa că preferința utilizatorului nu se pierde.
8. `ModalHost`.
9. `App.tsx`: randează `AppShell` cu placeholdere text în fiecare slot. Șterge pagina de verificare din plan 02.
10. Shortcut-uri de bază, direct cu `keydown` în `App.tsx` (se mută în registrul din plan 20):
    - `Ctrl/Cmd+B` → sidebar;
    - `Ctrl/Cmd+Alt+B` → inspector.
11. Test `AppShell`: sloturile apar, iar inspector-ul lipsește când nu e vizibil.

## Criterii de acceptare
- Layout-ul corespunde vizual prototipului la 1440×900 și rămâne corect la 960×600.
- Redimensionarea sub 1100px ascunde inspector-ul, iar peste 1100px îl readuce doar dacă utilizatorul nu l-a închis.
- `src/shared/**` nu importă din `src/modules/**` (verificare cu grep; opțional, regulă ESLint `no-restricted-imports` adăugată acum).

## Commit
`feat(layout): app shell, ui store and editor contribution registry`

## În afara scopului
Conținutul sidebar-ului, tab-urile, status bar-ul, editoarele.
