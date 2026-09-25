# Archon Docs Studio — Arhitectura fișierelor

Documentul descrie structura completă a proiectului: ce există deja și ce adaugă fiecare plan din `plans/`.
Se actualizează la finalul fiecărui plan.

**Legendă:**
- ✅ implementat;
- `[NN]` planul care creează fișierul;
- `[NN*]` planul care modifică un fișier existent.

**Stare curentă:** planurile 01–06 sunt implementate (tokenuri, primitive UI, TitleBar și fereastră frameless, layout shell responsive, setări persistate, status bar cu segmente și notificări toast).

---

## 1. Vedere de ansamblu

```
┌──────────────────────── Procesul MAIN (Node.js) ────────────────────────┐
│ electron/main.ts ─► modules/window-manager.ts  (BrowserWindow, ramă)    │
│                 └► modules/ipc/index.ts        (handlere pe domenii)    │
│                        ├ app.handler  ├ window.handler  ├ fs / db / …   │
│                        └ typed-ipc.ts  handle() + send(), tipate        │
└───────────────────────────────▲──────────────────┬──────────────────────┘
          ipcRenderer.invoke    │                  │  webContents.send
┌───────────────────────────────┴──────────────────▼──────────────────────┐
│ electron/preload.ts   contextBridge → window.archon (ArchonApi)             │
│                       whitelist de canale + whitelist de evenimente     │
└───────────────────────────────▲─────────────────────────────────────────┘
┌───────────────────────── Procesul RENDERER (React) ─────────────────────┐
│ src/core/ipc/ipc-client.ts   singurul punct care atinge window.archon     │
│ src/App.tsx                  compoziția: shell + contribuții de editor  │
│ src/modules/*                module independente (nu se importă între   │
│                              ele; comunică prin store-uri și contracte) │
│ src/shared/*                 UI, layout, hook-uri, utilitare comune     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Contractul IPC** (`src/core/types/ipc.types.ts`) este sursa unică de adevăr:
- `IpcInvokeContract` descrie cererile renderer → main;
- `IpcEventContract` descrie evenimentele main → renderer;
- `ArchonApi` descrie suprafața expusă pe `window.archon`.

Main, preload și renderer se tipează din el, deci un canal inexistent sau un payload greșit nu compilează.

**Direcția dependențelor:**

```
App.tsx ─► modules/* ─► shared/* ─► store/* ─► core/*
(fiecare strat poate importa din oricare strat aflat la dreapta lui, niciodată spre stânga)
electron/* ─► src/core/types, src/core/constants, src/core/settings (doar cod pur, fără DOM / React)
```

Reguli:
- `core/` nu importă nimic din afara lui.
- `shared/` și `store/` nu cunosc modulele. Regula ESLint `no-restricted-imports` blochează importurile din `@/modules/*` în `core/`, `shared/` și `store/`.
- Modulele nu se importă între ele.
- `electron/` importă din `src/` doar tipuri și constante pure; `tsconfig.node.json` le listează explicit.

---

## 2. Rădăcina proiectului

```
Archon/
├── architecture/
│   └── ARCHITECTURE.md            ✅ acest document
├── plans/                         ✅ planurile de implementare 00–20
├── build/                         ✅ resurse electron-builder (icoane, entitlements macOS)
├── resources/                     ✅ assets statice împachetate (icon.png)
├── formats/                       JSON Schema pentru formatele custom
│   ├── arws.schema.json            [07]
│   ├── ardoc.schema.json           [09]
│   └── ardiag.schema.json          [09]
├── electron/                      procesul main (vezi §3)
├── src/                           procesul renderer (vezi §4)
├── index.html                     ✅ entry HTML, CSP strict (default-src 'self')
├── package.json                   ✅ scripturi: dev, typecheck, lint, test, build:*
├── electron.vite.config.ts        ✅ build main / preload / renderer, alias `@` → src
├── electron-builder.yml           ✅ packaging Windows / macOS / Linux
├── vitest.config.ts               ✅ jsdom, include src/** și electron/**
├── eslint.config.mjs              ✅ TS + React + hooks + Prettier + regula de straturi [04]
├── tsconfig.json                  ✅ referințe către node / web
├── tsconfig.node.json             ✅ electron/** + src/core/types + src/core/constants + src/core/settings
├── tsconfig.web.json              ✅ src/**
├── .prettierrc.yaml, .prettierignore, .editorconfig, .gitignore   ✅
└── .vscode/                       ✅ launch, settings, extensii recomandate
```

---

## 3. `electron/` — procesul main

```
electron/
├── main.ts                        ✅ single-instance lock, meniul aplicației [05], înregistrare IPC, creare fereastră
├── preload.ts                     ✅ contextBridge: ArchonApi (app, window, on); whitelist de evenimente [03]
└── modules/
    ├── window-manager.ts          ✅ BrowserWindow securizat, ramă per platformă, emite maximized-changed [03]
    │                                 [05*] fundal după tema salvată, bounds + maximized + zoom restaurate, fără pinch-zoom
    ├── window-bounds.ts           ✅ funcție pură resolveInitialBounds (min 720×480, 90% workArea) [03]
    │                                 [05*] bounds salvate, folosite doar dacă ≥ 50% sunt pe un ecran conectat
    ├── window-bounds.test.ts      ✅
    ├── window-state.ts            ✅ [05] salvează bounds + maximized (debounce 500ms, sincron la close)
    ├── app-menu.ts                ✅ [05] înlocuiește meniul implicit (scurtăturile de zoom Chromium)
    ├── ipc/
    │   ├── index.ts               ✅ registerIpcHandlers()
    │   ├── typed-ipc.ts           ✅ handle<C>() cu verificare sender, send<E>() tipat [03]
    │   ├── app.handler.ts         ✅ app:get-info
    │   ├── window.handler.ts      ✅ window:minimize / toggle-maximize / close / is-maximized / set-titlebar-colors [03]
    │   │                             [05*] window:set-zoom (validat 0.8–1.5)
    │   ├── settings.handler.ts    ✅ [05] settings:get / update, system:get-theme, evenimentul system:theme-changed
    │   ├── workspace.handler.ts      [07] creare / deschidere workspace, evenimente watcher
    │   ├── fs.handler.ts             [09] CRUD .ardoc / .ardiag / foldere
    │   ├── db.handler.ts          ✅ [10] index:get-status / rebuild / list-tags, search:query
    │   └── export.handler.ts      ✅ [19] export:save, export:pdf-from-svg
    ├── settings/
    │   ├── index.ts               ✅ [05] getSettingsStore() → userData/settings.json
    │   ├── settings.ts            ✅ [05] SettingsStore: citire validată, fișier corupt pus deoparte, scriere atomică serializată
    │   └── settings.test.ts       ✅ [05] Node, pe un director temporar
    ├── file-system/
    │   ├── paths.ts                  [07] rezolvare și validare căi în workspace
    │   ├── workspace.ts              [07] .arws: creare, deschidere, recente
    │   ├── reader.ts                 [07] citire + validare zod
    │   ├── writer.ts                 [07] scriere atomică
    │   ├── watcher.ts                [07] chokidar → evenimente către renderer
    │   ├── entries.ts                [09] arbore de fișiere / foldere
    │   ├── documents.ts              [09] operații .ardoc
    │   ├── diagrams.ts               [09] operații .ardiag
    │   └── naming.ts                 [09] nume unice, sanitizare
    ├── index-service.ts           ✅ [10] index deschis cu workspace-ul, fullSync în fundal, evenimente watcher, index:progress
    ├── database/
    │   ├── db.ts                  ✅ [10] better-sqlite3 (WAL, foreign_keys), userData/indexes/<workspaceId>.db + app.db
    │   ├── indexer.ts             ✅ [10] fullSync (mtime/size), syncPath incremental, coadă serială, loturi de 50
    │   ├── disk-scan.ts           ✅ [10] fișierele app de pe disc + citire validată (fișier invalid → sărit, logat)
    │   ├── text-extract.ts        ✅ [10] text simplu din TipTap
    │   ├── migrations/
    │   │   ├── index.ts           ✅ [10] runner după PRAGMA user_version, o tranzacție per migrare
    │   │   ├── 001_initial.ts     ✅ [10] DB per workspace (files, tags, doc_links, diagram_nodes, search_fts); workspaceSchemaSql(kinds)
    │   │   ├── 002_file_kinds.ts  ✅ schema recreată goală pentru tipurile ardoc / ardiag (indexul se repopulează la fullSync)
    │   │   ├── workspace.ts       ✅ WORKSPACE_MIGRATIONS
    │   │   └── app/001_projects.ts ✅ [10] DB la nivel de aplicație
    │   └── repositories/
    │       ├── file-rows.ts       ✅ [10] statement-uri comune documente / diagrame
    │       ├── documents.repo.ts  ✅ [10]
    │       ├── diagrams.repo.ts   ✅ [10] noduri + rânduri FTS per nod
    │       ├── projects.repo.ts   ✅ [10]
    │       └── search.repo.ts     ✅ [10] FTS5 cu prefix, snippet() și bm25, listă de tag-uri
    └── export/
        ├── save-file.ts           ✅ [19] dialog nativ (ultimul folder, în setări) + scriere; calea vine doar din dialog
        ├── save-file.test.ts      ✅ [19]
        └── svg-to-pdf.ts          ✅ [19] fereastră ascunsă, sandbox, fără JS; printToPDF pe o pagină de mărimea SVG-ului
```

---

## 4. `src/` — procesul renderer

### 4.1 Entry și teste

```
src/
├── main.tsx                       ✅ React root, QueryClient    [05*] încarcă setările, aplică tema și layout-ul, apoi randează
├── App.tsx                        ✅ [04] singurul loc de compoziție: AppShell, contribuții de editor,
│                                     modale, scurtăturile Ctrl+B / Ctrl+Alt+B
├── App.test.tsx                   ✅
├── env.d.ts                       ✅ tipul global window.archon
└── test/
    ├── setup.ts                   ✅ jest-dom + cleanup
    ├── archon-api-mock.ts           ✅ mock complet pentru window.archon, cu emit() [03]   [05*] setări stocate în memorie
    └── render-with-query.tsx      ✅ [05] QueryClient proaspăt pentru render / renderHook
```

### 4.2 `core/` — nucleu fără dependențe

```
src/core/
├── ipc/
│   └── ipc-client.ts              ✅ ipcClient.app / window / on [03]; settings / system / isAvailable [05]
│                                     apelurile nu aruncă sincron: bridge lipsă → promise respins
├── types/
│   ├── index.ts                   ✅ barrel
│   ├── ipc.types.ts               ✅ IpcInvokeContract, IpcEventContract, ArchonApi [03]   [05*] settings, system, set-zoom
│   ├── editor.types.ts            ✅ [04] FileKind, EditorTabRef, EditorContribution
│   ├── layout.types.ts            ✅ [04] PanelId, PanelMode, PanelPreference, PanelState, PanelLayout
│   ├── ui.types.ts                ✅ [04] ModalId
│   ├── settings.types.ts          ✅ [05] AppSettings, SettingsPatch (DeepPartial), ThemePreference, ResolvedTheme, AccentColor
│   ├── workspace.types.ts            [07]
│   ├── document.types.ts             [09]
│   ├── diagram.types.ts              ✅ [09] UmlDiagramType (14), DiagramType
│   └── export.types.ts            ✅ [19] ExportExtension, cererile export:save / export:pdf-from-svg
├── settings/                      ✅ [05] cod pur partajat de main și renderer
│   ├── normalize-settings.ts      ✅ normalizeSettings (validare câmp cu câmp), mergeSettings, snapUiZoom
│   └── tests/                     ✅
├── schemas/                          scheme zod; tipurile se derivă din ele
│   ├── workspace.schema.ts           [07]
│   ├── document.schema.ts            [09]
│   └── diagram.schema.ts             [09]
├── constants/
│   ├── app.constants.ts           ✅ APP_NAME, QUERY_KEYS   [05] DEFAULT_SETTINGS, ACCENT_OPTIONS, UI_ZOOM_STEPS, RECENT_WORKSPACES_LIMIT
│   ├── layout.constants.ts        ✅ LAYOUT, TITLEBAR_DENSITY, TITLEBAR_INSETS [03]; SIDEBAR_WIDTH, INSPECTOR_WIDTH,
│   │                                 MAIN_MIN_WITH_*, PANEL_RESIZE_STEP, OVERLAY_EDGE_GAP [04]
│   ├── file-extensions.ts            [09] .arws, .ardoc, .ardiag
│   └── shortcuts.ts               ✅ [20] registrul: id, combinații, scope, descriere; assertNoConflicts
└── editor/
    ├── EditorContributionsProvider.tsx  ✅ [04] context + useEditorContribution(kind); kind duplicat → eroare
    ├── save-registry.ts                 ✅ [11] registerSaveHandler / saveTab: garda de tab-uri cere salvarea fără import între module
    └── tests/                           ✅
```

### 4.3 `store/` — stare globală (Zustand)

```
src/store/
├── index.ts                       ✅ [04]
├── ui.store.ts                    ✅ [04] panouri (visible / width / overlayOpen), lastOverlay, panelResizing,
│                                     modal activ   [05*] resolvedTheme, hydratePanels   [06*] toast, notify, dismissToast
├── status.store.ts                ✅ [06] textul și tonul segmentului de stare („Ready” / „Connecting…”)
├── tests/                         ✅ ui.store, status.store
├── workspace.store.ts                [07] workspace curent, arbore, folder țintă
├── editor.store.ts                   ✅ [11] tab-uri, tab activ, dirty; [17] pendingSelection; [20] pendingFocus
└── search-palette.store.ts        ✅ [20] cererea paletei (filtru de tip, onPick), openSearchPalette
```

### 4.4 `modules/` — module funcționale independente

Fiecare modul expune în `index.ts` doar API-ul public. Modulele-editor exportă o `EditorContribution`.

```
src/modules/
├── workspace/                                    [07–09]
│   ├── index.ts
│   ├── components/
│   │   ├── WorkspaceLanding.tsx                  [07] ecranul fără workspace deschis
│   │   ├── WorkspaceSidebar.tsx                  [08]
│   │   ├── WorkspaceHeader.tsx                   [08]
│   │   ├── SidebarTabs.tsx                       [08] Files / Diagrams
│   │   ├── NewMenu.tsx                           [08] split-button „New”; [17] deschide dialogul
│   │   ├── FileTree.tsx                          [08] listă virtualizată
│   │   ├── FileTreeNode.tsx                      [08]
│   │   ├── TreeGuides.tsx                        [08] liniile de ghidaj
│   │   ├── SidebarFooter.tsx                     [08]
│   │   ├── InlineRename.tsx                      [09]
│   │   ├── ConfirmDeleteModal.tsx                [09]
│   │   └── (meniul contextual)                   ✅ [20] utils/tree-menu-items.ts + useContextMenu în WorkspaceSidebar
│   ├── hooks/
│   │   ├── useWorkspace.ts                       [07]
│   │   ├── useFileActions.ts                     [09] (crearea de diagrame e în useCreateDiagram [17])
│   │   └── useTreeKeyboard.ts                    [08] săgeți; Enter / F2 / Delete din registru [20]
│   └── utils/
│       ├── flatten-tree.ts                       [08]
│       └── tree-menu-items.ts                    ✅ [20] New… (în folder) / Rename / Reveal / Copy path / Delete
│
├── editor/                                       ✅ [11] tab system + EditorPane
│   ├── index.ts                                  ✅
│   ├── components/
│   │   ├── EditorTabs.tsx                        ✅ scroll orizontal, fade la margini, „+”
│   │   ├── EditorTab.tsx                         ✅ dirty, close ascuns sub 120px, middle-click
│   │   ├── TabOverflowMenu.tsx                   ✅ toate tab-urile, la overflow
│   │   ├── EditorPane.tsx                        ✅ randează contribuția după FileKind
│   │   ├── EditorErrorBoundary.tsx               ✅ singura componentă clasă (documentat)
│   │   ├── UnsavedChangesModal.tsx               ✅ Save / Don't save / Cancel, și la închiderea ferestrei
│   │   ├── WelcomeScreen.tsx                     ✅
│   │   └── (meniul contextual)                   ✅ [20] utils/tab-menu-items.ts + useContextMenu în EditorTabs
│   ├── hooks/
│   │   ├── useEditorTabs.ts                      ✅ garda: salvează, apoi întreabă; requestQuit
│   │   ├── useHorizontalOverflow.ts              ✅
│   │   ├── useTabSession.ts                      ✅ settings.session.tabsByWorkspace (debounce 500ms)
│   │   ├── useTabReconciliation.ts               ✅ închide tab-urile fișierelor dispărute
│   │   ├── useTabShortcuts.ts                    ✅ Ctrl/Cmd+W, Ctrl+(Shift+)Tab
│   │   └── useQuitGuard.ts                       ✅ răspunde la app:before-quit
│   ├── store/close-guard.store.ts                ✅ ce întreabă modalul
│   └── utils/tree-files.ts                       ✅
│
├── document-editor/                              ✅ [12] TipTap
│   ├── index.ts                                  ✅ contribuția pentru `ardoc`
│   ├── components/
│   │   ├── DocumentEditor.tsx                    ✅ cale, titlu, corp; coloană min(640px, 100% - 48px)
│   │   ├── DocumentTitle.tsx                     ✅
│   │   ├── Toolbar.tsx                           ✅ slot TitleBar, respectă densitatea
│   │   ├── format-groups.ts                      ✅ FORMAT_GROUPS, descrise o singură dată
│   │   ├── FormatMenu.tsx                        ✅ grup pliat în meniu (minimal)
│   │   ├── DocumentInspector.tsx                 ✅ tag-uri, diagrame legate
│   │   ├── DocumentStatusItems.tsx               ✅ „N words”
│   │   └── extensions/index.ts                   ✅ StarterKit, Link, Placeholder, Typography
│   ├── hooks/
│   │   ├── useDocumentController.ts              ✅ editor + autosave + sesiune + reîncărcare externă
│   │   ├── useDocumentEditor.ts                  ✅
│   │   ├── useDocumentFile.ts                    ✅
│   │   └── useAutosave.ts                        ✅ 800ms, Ctrl/Cmd+S, flush la unmount
│   ├── store/document-editor.store.ts            ✅ sesiunea per tabId, citită de toolbar / inspector
│   ├── utils/word-count.ts                       ✅
│   └── styles/prose.css                          ✅
│
├── diagram-editor/                               [13–19] React Flow + Mermaid
│   ├── index.ts                                  ✅ [13] contribuția pentru `ardiag`
│   ├── components/
│   │   ├── DiagramEditor.tsx                     ✅ [13] store-ul tab-ului + canvas; [18] comutare canvas / Mermaid după engine
│   │   ├── DiagramCanvas.tsx                     ✅ [13] React Flow controlat, grilă de puncte, fitView la prima deschidere
│   │   ├── DiagramStatusItems.tsx                ✅ [13] noduri · muchii, selecție, zoom
│   │   ├── NodePalette.tsx                       ✅ [15] 7 unelte, meniu de tipuri, „⋯” în minimal
│   │   ├── PropertiesPanel.tsx                   ✅ [16] contribuția Inspector, sub-panou după selecție
│   │   ├── MermaidEditor.tsx                     ✅ [18] split row / column / single (760 / 480px), raport 20–80%
│   │   ├── canvas/
│   │   │   ├── CanvasOverlays.tsx                ✅ [13] reguli responsive (minimap < 560×360, hint < 640)
│   │   │   ├── CanvasHint.tsx                    ✅ [13]
│   │   │   ├── CanvasMinimap.tsx                 ✅ [13] MiniMap React Flow stilizat
│   │   │   ├── ZoomControls.tsx                  ✅ [13] zoom-ul canvas-ului, salvat cu viewport-ul
│   │   │   ├── ZoomBar.tsx                       ✅ [18] − / % / +, 30–200%, comun cu previzualizarea Mermaid
│   │   │   └── (meniu contextual)                ✅ [20] hooks/useCanvasContextMenu.ts + utils/canvas-menu-items.ts
│   │   ├── nodes/
│   │   │   ├── index.ts                          ✅ [14] NODE_TYPES; Trigger/Action/Decision/Integration/ElementNode = BaseNode
│   │   │   ├── BaseNode.tsx                      ✅ [14] card / outline / solid; decizia ca romb SVG
│   │   │   ├── node-skin.ts                      ✅ [14] getNodeSkin → clasă + variabile --node-*
│   │   │   ├── NodeHandles.tsx                   ✅ [14] target stânga, source dreapta
│   │   │   ├── NodeSelectionChrome.tsx           ✅ [14] inel, grip-uri, badge id, ștergere
│   │   │   ├── BasicNode.tsx                     ✅ [13] provizoriu pentru shape-* / text
│   │   │   ├── ShapeNode.tsx                     ✅ [15] rect / ellipse / text (TextNode), NodeResizer
│   │   │   ├── shape-style.ts                    ✅ [15] stroke / fill 16% / weight / font
│   │   │   └── (meniu contextual)                ✅ [20] nodeMenuItems: Duplicate / Copy / Copy id / Change type ▸ / Delete
│   │   ├── edges/
│   │   │   ├── index.ts                          ✅ [14] EDGE_TYPES
│   │   │   ├── edge-path.ts                      ✅ [14] calea după edgeStyle (funcție pură)
│   │   │   ├── SoarEdge.tsx                      ✅ [14] curved / orthogonal / straight, „hot”, etichetă
│   │   │   └── EdgeMarkers.tsx                   ✅ [14]
│   │   ├── toolbar/
│   │   │   ├── DiagramToolbar.tsx                ✅ [15] slot TitleBar, aranjament după densitate
│   │   │   ├── StyleControls.tsx                 ✅ [15] inline (pill-uri) / stacked
│   │   │   ├── StylePickers.tsx                  ✅ [15] swatch-uri, grosime, font 8–72
│   │   │   ├── ToolbarPopover.tsx                ✅ [15] popover flip/shift
│   │   │   ├── useStyleValues.ts                 ✅ [15] stilul selecției sau implicit
│   │   │   ├── StylePopover.tsx                  ✅ [15] densitățile `compact` / `minimal`
│   │   │   ├── HistoryButtons.tsx                ✅ [15]
│   │   │   └── ExportMenu.tsx                    ✅ [19] slot TitleActions; IconButton în minimal
│   │   ├── properties/                           ✅ [16]
│   │   │   ├── NodeProperties.tsx                ✅ name, subtitle, color, description, tags, retry, delete
│   │   │   ├── NodeIdentity.tsx                  ✅ badge, tip, id
│   │   │   ├── EdgeProperties.tsx                ✅ label, delete
│   │   │   ├── MultiSelectionProperties.tsx      ✅ culoare comună, „Delete N nodes”
│   │   │   ├── ColorField.tsx                    ✅ cele 6 swatch-uri
│   │   │   ├── DeleteButton.tsx                  ✅ aceeași acțiune ca tasta Delete
│   │   │   ├── EmptySelection.tsx                ✅
│   │   │   └── Field.tsx                         ✅ SectionLabel + control
│   │   ├── new-diagram/                          ✅ [17] dialogul „New diagram” (modalul `new-diagram`)
│   │   │   ├── NewDiagramDialog.tsx              ✅ categorie, căutare, tip; Enter creează
│   │   │   ├── DialogHeader.tsx                  ✅ căutarea pe rând propriu < 600px
│   │   │   ├── DialogFooter.tsx                  ✅ două rânduri < 720px
│   │   │   ├── CategoryList.tsx                  ✅ coloană / tab-uri (< 760px), alese din CSS
│   │   │   ├── DiagramTypeGrid.tsx               ✅ listbox pe grupuri, săgeți, stare goală
│   │   │   ├── DiagramTypeCard.tsx               ✅
│   │   │   ├── DiagramSketch.tsx                 ✅ SVG 160×54 pe grila de puncte
│   │   │   └── DestinationPicker.tsx             ✅ „saves to”, = workspace.store.targetFolder
│   │   └── mermaid/                              ✅ [18]
│   │       ├── MermaidSourcePane.tsx             ✅ textarea mono, Tab = 2 spații (undo nativ păstrat)
│   │       ├── MermaidPreview.tsx                ✅ SVG pe grila de 22px, zoom Ctrl/⌘ + roată
│   │       ├── MermaidError.tsx                  ✅ pill --danger cu linia erorii
│   │       └── LineNumbers.tsx                   ✅ sincronizat la scroll
│   ├── store/                                    stare locală modulului
│   │   ├── diagram.store.ts                      ✅ [13] noduri, muchii, viewport, selecție, revision
│   │   ├── DiagramStoreProvider.tsx              ✅ [13] un store per tab
│   │   ├── store-registry.ts                     ✅ [13] Map<tabId, store>, curățat la închiderea tab-ului
│   │   ├── diagram-state.ts                      ✅ [15] tipurile store-ului
│   │   ├── graph-edits.ts                        ✅ [15] add / delete / connect / stil / undo / redo; [16] date noduri, etichete muchii
│   │   ├── history.ts                            ✅ [15] undo / redo, 30 de pași
│   │   ├── tool.store.ts                         ✅ [15] unealta activă (slice în store-ul tab-ului)
│   │   └── mermaid.store.ts                      ✅ [18] sursa (meta.mermaidSource), raportul split-ului, zoom-ul previzualizării
│   ├── hooks/
│   │   ├── useDiagram.ts                         ✅ [13] încărcare, autosave, reîncărcare externă
│   │   ├── useNodeTypes.ts                       ✅ [14] diagram.style → setarea aplicației → implicit
│   │   ├── useHotEdges.ts                        ✅ [14] useIsHotEdge, derivat din selecție
│   │   ├── useCanvasInteractions.ts              ✅ [15] plasare, connect în doi pași, pan
│   │   ├── useConnectingStatus.ts                ✅ [15] „Connecting…” în status bar
│   │   ├── useDiagramShortcuts.ts                ✅ [15] Delete, undo/redo, Escape, V/H/N/C/T/R/O; [20] din registru, + C / V / D
│   │   ├── useNodeClipboard.ts                   ✅ [20] copy / paste (la cursor sau +24px) / duplicate
│   │   ├── useCanvasContextMenu.ts               ✅ [20] click dreapta pe canvas și pe noduri
│   │   ├── useFocusRequest.ts                    ✅ [20] centrează pe nodul cerut de căutare (fitView)
│   │   ├── useDeleteSelection.ts                 ✅ [16] ștergere + toast, comună tastei și panoului
│   │   ├── useSelectedElements.ts                ✅ [16] nod / muchie / multiplu / nimic
│   │   ├── useCommitOnFocus.ts                   ✅ [16] un pas de undo per editare de câmp
│   │   ├── useTagSuggestions.ts                  ✅ [16] index:list-tags, gol dacă indexul nu e gata
│   │   ├── useCreateDiagram.ts                   ✅ [17] fs:create-diagram + expandare, tab, N1 selectat, toast
│   │   ├── useMermaidRender.ts                   ✅ [18] debounce 300ms, ultimul SVG valid, re-randare la temă
│   │   ├── useThemeKey.ts                        ✅ [18] tema și accentul aplicate pe <html>
│   │   └── useExportDiagram.ts                   ✅ [19] toast-uri, exportedAt scris direct dacă tab-ul e curat
│   ├── constants/
│   │   ├── node-kinds.ts                         ✅ [14]
│   │   ├── node-palette.ts                       ✅ [14] paleta semantică de 6 culori (date, nu temă)
│   │   ├── tools.ts                              ✅ [15] unelte, hint-uri
│   │   ├── style.ts                              ✅ [15] grosimi, interval font
│   │   ├── diagram-catalog.ts                    ✅ [17] catalogul UML, 7 structural / 7 behavioral
│   │   ├── diagram-sketches.ts                   ✅ [17] primitive rect / circle / ellipse / path
│   │   └── diagram-starters.ts                   ✅ [17] class / sequence / state / usecase / activity
│   ├── utils/
│   │   ├── graph-mapping.ts                      ✅ [13] .ardiag ↔ React Flow
│   │   ├── zoom.ts                               ✅ [13] limite și pași de zoom
│   │   ├── canvas-layout.ts                      ✅ [13] praguri responsive ale canvas-ului
│   │   ├── node-factory.ts                       ✅ [15] id N<k> / E<k> cel mai mic liber
│   │   ├── build-starter-graph.ts                ✅ [17] N1, N2 pe diagonală, muchia N1 → N2
│   │   ├── filter-catalog.ts                     ✅ [17] categorie + căutare, grupat
│   │   ├── folder-paths.ts                       ✅ [17] folderele arborelui, pentru „saves to”
│   │   ├── mermaid-layout.ts                     ✅ [18] aranjamentul după lățime
│   │   ├── clipboard.ts                          ✅ [20] application/x-archon-nodes (JSON ca text), remapare id-uri, +24px
│   │   └── canvas-menu-items.ts                  ✅ [20] meniurile canvas-ului și ale nodului
│   ├── mermaid/                                  ✅ [18] pachetul `mermaid`, chunk separat
│   │   ├── mermaid-loader.ts                     ✅ import() leneș, strict + base, id unic per randare
│   │   ├── templates.ts                          ✅ sequence / class / state; activity și usecase ca flowchart
│   │   └── theme-variables.ts                    ✅ tokenuri hex → themeVariables
│   ├── export/                                   ✅ [19]
│   │   ├── export-formats.ts                     ✅ PNG / SVG / PDF / UML XMI, isAvailable
│   │   ├── export-image.ts                       ✅ data URL → SVG / bytes, fundalul --canvas
│   │   ├── export-canvas.ts                      ✅ html-to-image pe viewport, încadrat pe noduri (+24px), fără UI de editare
│   │   ├── export-mermaid.ts                     ✅ re-randare cu etichete SVG, PNG prin <canvas> la 2×
│   │   └── xmi/                                  ✅ UML 2.5.1
│   │       ├── serialize-xmi.ts                  ✅ dispecer: class / activity / state
│   │       ├── xmi-writer.ts                     ✅ documentul, escape, id-uri
│   │       ├── class.xmi.ts                      ✅ Class + Association
│   │       ├── activity.xmi.ts                   ✅ Activity, OpaqueAction / DecisionNode / InitialNode, ControlFlow
│   │       └── state.xmi.ts                      ✅ StateMachine, Region, State, Transition
│   └── styles/
│       ├── react-flow.css                        ✅ [13] --xy-* din tokenuri
│       ├── nodes.css                             ✅ [14] noduri, skin-uri, romb
│       ├── node-chrome.css                       ✅ [14] handle-uri, selecție
│       ├── edges.css                             ✅ [14] muchii, markere, animația „hot”
│       ├── tools.css                             ✅ [15] cursoare, forme, redimensionare
│       ├── new-diagram.css                       ✅ [17] grila de puncte a schițelor
│       └── mermaid.css                           ✅ [18] grila de puncte a previzualizării
│
└── search/                                       ✅ [20] Ctrl+K
    ├── index.ts                                  ✅ GlobalSearch (modalul `command-palette`)
    ├── components/
    │   ├── GlobalSearch.tsx                      ✅ combobox + listbox grupat, ↑↓ / ⏎ / esc, filtru de tip
    │   ├── SearchResultRow.tsx                   ✅ cale trunchiată la mijloc, rândul activ ca în arbore
    │   └── HighlightedSnippet.tsx                ✅ fără HTML: marcajele devin <mark>
    ├── hooks/useSearch.ts                        ✅ debounce 150ms, minimum 2 caractere, keepPreviousData
    └── utils/
        ├── group-results.ts                      ✅ Files / Nodes / Content
        ├── snippet-parts.ts                      ✅
        └── open-result.ts                        ✅ fișier; nod: pendingSelection + pendingFocus
```

### 4.5 `shared/` — cod comun, fără cunoștințe despre module

```
src/shared/
├── components/
│   ├── icons/
│   │   ├── index.ts               ✅
│   │   ├── Icon.tsx               ✅ SVG stroke, stil Lucide
│   │   └── icon-paths.ts          ✅ registru tipat   [03*] logo, winMinimize / winMaximize / winRestore
│   ├── ui/                        ✅ primitive [02]
│   │   ├── index.ts               ✅
│   │   ├── Button.tsx             ✅
│   │   ├── IconButton.tsx         ✅ [20] shortcut: combinația în tooltip + aria-keyshortcuts
│   │   ├── SplitButton.tsx        ✅
│   │   ├── ControlPill.tsx        ✅
│   │   ├── Input.tsx              ✅
│   │   ├── SearchInput.tsx        ✅
│   │   ├── Textarea.tsx           ✅
│   │   ├── Toggle.tsx             ✅
│   │   ├── SegmentedControl.tsx   ✅
│   │   ├── Swatch.tsx             ✅
│   │   ├── TagInput.tsx           ✅ [16] sugestii opționale
│   │   ├── Menu.tsx               ✅ flip / shift în viewport; [19] title pe MenuItem
│   │   ├── Modal.tsx              ✅ limitat la viewport; [20] maxHeight
│   │   ├── Tooltip.tsx            ✅
│   │   ├── Divider.tsx            ✅
│   │   ├── Kbd.tsx                ✅
│   │   ├── SectionLabel.tsx       ✅
│   │   ├── EmptyState.tsx         ✅
│   │   ├── Toast.tsx              ✅ [06] prezentațional: info / error (2 rânduri, role=alert)
│   │   ├── ContextMenu.tsx        ✅ [20] useContextMenu: la cursor, pe Menu
│   │   ├── ContextMenuList.tsx    ✅ [20] acțiuni, separatoare, submeniuri (stânga dacă nu încap)
│   │   ├── context-menu.types.ts  ✅ [20]
│   │   └── tests/                 ✅ Menu, Modal, SegmentedControl, TagInput, Toggle
│   └── layout/
│       ├── TitleBar.tsx           ✅ [03] sloturi toolbar / actions, densitate, rezervări per OS
│       ├── title-bar/             ✅ [03]
│       │   ├── BrandMark.tsx          pătrat accent + APP_NAME (compact → tooltip)
│       │   ├── WindowControls.tsx     doar Linux: minimize / maximize-restore / close
│       │   ├── ThemeToggleButton.tsx  doar UI; legat de useTheme în App.tsx [05]
│       │   ├── TitleBarDensityContext.tsx  context + useTitleBarDensity()
│       │   ├── title-bar-density.ts   funcție pură, cu histerezis
│       │   └── tests/                 BrandMark, WindowControls, title-bar-density
│       ├── tests/                 ✅ TitleBar, AppShell, SidePanel, PanelResizeHandle, ModalHost, StatusBar, ToastViewport
│       ├── AppShell.tsx           ✅ [04] gridul ferestrei; coloane din PanelLayout
│       ├── SidePanel.tsx          ✅ [04] docked / overlay: poziție, animație, focus, Escape
│       ├── PanelResizeHandle.tsx  ✅ [04] generic, pointer + tastatură; [18] orientation, scale (split view)
│       ├── Sidebar.tsx            ✅ [04] cadrul panoului stâng
│       ├── InspectorPanel.tsx     ✅ [04] header „Properties” + închidere
│       ├── ModalHost.tsx          ✅ [04] modalul activ din ui.store
│       ├── StatusBar.tsx          ✅ [04] containerul de 24px   [06*] sloturi left / right, container `statusbar`
│       ├── StatusSegment.tsx      ✅ [06] segment: punct, mono, priority 1–3, grow
│       ├── StatusPath.tsx         ✅ [06] calea activă, trunchiată la mijloc după lățime, tooltip
│       ├── ShellStatusBar.tsx     ✅ [06] compunerea: stare, cale, StatusItems ale editorului, tema
│       ├── ToastViewport.tsx      ✅ [06] toast-ul din ui.store, 1900ms, aria-live
│       └── ShortcutsHelp.tsx      ✅ [20] Ctrl/Cmd+/: tot registrul, pe scope, 2 coloane peste 900px
├── hooks/
│   ├── useClickOutside.ts         ✅
│   ├── useElementSize.ts          ✅
│   ├── useEscape.ts               ✅
│   ├── useFloatingPosition.ts     ✅
│   ├── usePlatform.ts             ✅ [03] platforma din app:get-info (staleTime: Infinity)
│   ├── useWindowSize.ts           ✅ [04] grupat pe requestAnimationFrame
│   ├── usePanelLayout.ts          ✅ [04] fereastră + store → PanelLayout; închide cererile de sertar expirate
│   ├── usePanelResize.ts          ✅ [04] legătura mâner ↔ ui.store
│   ├── useSettings.ts             ✅ [05] settingsQuery, useSettings(), useUpdateSettings() optimist
│   ├── useTheme.ts                ✅ [05] temă efectivă, tema OS live, overlay Windows, toggle
│   ├── useLayoutPersistence.ts    ✅ [05] salvează panourile (debounce 300ms, nu în timpul drag-ului)
│   ├── useUiZoom.ts               ✅ [05] Ctrl/Cmd + = / - / 0, trepte 80–150%   [06*] toast „Zoom N%”   [20] din registru
│   ├── tests/                     ✅ [05] useTheme, useLayoutPersistence, useUiZoom
│   ├── useDebounce.ts             ✅ [12] useDebouncedCallback (flush / cancel, onUnmount)
│   ├── useWorkspaceFile.ts        ✅ [13] query pe un fișier, reîncărcat la workspace:tree-changed
│   ├── useFileAutosave.ts         ✅ [13] autosave comun documente / diagrame (800ms, Ctrl/Cmd+S, flush)
│   ├── useExternalChanges.ts      ✅ [13] fișier schimbat pe disc: reload sau toast de conflict
│   ├── usePanelShortcuts.ts       ✅ [11] Ctrl/Cmd+B, Ctrl/Cmd+Alt+B (din registru [20])
│   ├── useIndexProgress.ts        ✅ [10] „Indexing…” în status bar
│   └── useKeyboard.ts             ✅ [15] combinații mod+z, ignoră câmpurile editabile; [20] useShortcuts / useShortcut / matchesShortcut, tasta fizică la combinații cu modificator
└── utils/
    ├── cn.ts                      ✅
    ├── floating-position.ts       ✅ [20] computeSubmenuPosition
    ├── truncate-middle.ts         ✅
    ├── tests/                     ✅ cn, floating-position, truncate-middle, panel-layout, apply-theme, platform
    ├── panel-layout.ts            ✅ [04] resolvePanelLayout (funcție pură)
    ├── apply-theme.ts             ✅ [05] resolveTheme, applyTheme (data-theme, --accent), readTitleBarColors
    ├── platform.ts                ✅ [06] modKeyLabel (⌘ / Ctrl), formatShortcut; [20] formatCombo, shortcutLabel, ariaKeyShortcut, platformFromUserAgent
    ├── copy-text.ts               ✅ [20] clipboard + toast
    └── color.ts                   ✅ [14] hexToRgba
```

### 4.6 `styles/`

```
src/styles/
├── globals.css                    ✅ Tailwind v4 + @theme, fonturi locale, bază
│                                     [03*] utilitarele app-drag / app-no-drag + no-drag automat pe elementele interactive
│                                     [04*] animațiile sertarelor, cursorul global în timpul redimensionării
│                                     [06*] regulile @container ale status bar-ului (data-priority)
├── variables.css                  ✅ tokenuri fără temă (fonturi, raze, umbre, dimensiuni)
├── tokens.test.ts                 ✅
└── themes/
    ├── dark.css                   ✅
    └── light.css                  ✅
```

---

## 5. Convenții

| Regulă | Detaliu |
|---|---|
| Mărimea fișierelor | maximum 200 de linii; peste limită, fișierul se sparge în subcomponente sau hook-uri |
| Teste | în `tests/`, lângă codul testat; excepție: `electron/**` și `App.test.tsx`, care stau alături de fișier |
| IPC | niciun `ipcRenderer` / `require` în renderer; tot accesul trece prin `ipcClient` |
| Canale noi | se adaugă în `ipc.types.ts`, apoi handler → preload → `ipc-client` |
| Evenimente noi | se adaugă în `IpcEventContract` și în `SUBSCRIBABLE_EVENTS` din preload; lipsa din listă nu compilează |
| Stiluri | doar tokenuri (`bg-bg`, `text-fg-muted`, …), niciun hex în componente |
| Barele de titlu | orice element interactiv dintr-o zonă `app-drag` primește automat `no-drag` |
| Densitate | uneltele din TitleBar citesc `useTitleBarDensity()` și se restrâng în meniuri, fără să dispară |
| Commit | `feat(<modul>): <descriere>`, câte unul per plan |
