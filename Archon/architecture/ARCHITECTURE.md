# SOAR Docs Studio — Arhitectura fișierelor

Documentul descrie structura completă a proiectului: ce există deja și ce adaugă fiecare plan din `plans/`.
Se actualizează la finalul fiecărui plan.

**Legendă:**
- ✅ implementat;
- `[NN]` planul care creează fișierul;
- `[NN*]` planul care modifică un fișier existent.

**Stare curentă:** planurile 01–05 sunt implementate (tokenuri, primitive UI, TitleBar și fereastră frameless, layout shell responsive, setări persistate: temă, accent, layout, fereastră, zoom).

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
│ electron/preload.ts   contextBridge → window.soar (SoarApi)             │
│                       whitelist de canale + whitelist de evenimente     │
└───────────────────────────────▲─────────────────────────────────────────┘
┌───────────────────────── Procesul RENDERER (React) ─────────────────────┐
│ src/core/ipc/ipc-client.ts   singurul punct care atinge window.soar     │
│ src/App.tsx                  compoziția: shell + contribuții de editor  │
│ src/modules/*                module independente (nu se importă între   │
│                              ele; comunică prin store-uri și contracte) │
│ src/shared/*                 UI, layout, hook-uri, utilitare comune     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Contractul IPC** (`src/core/types/ipc.types.ts`) este sursa unică de adevăr:
- `IpcInvokeContract` descrie cererile renderer → main;
- `IpcEventContract` descrie evenimentele main → renderer;
- `SoarApi` descrie suprafața expusă pe `window.soar`.

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
│   ├── soarws.schema.json            [07]
│   ├── soardoc.schema.json           [09]
│   └── soardiag.schema.json          [09]
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
├── preload.ts                     ✅ contextBridge: SoarApi (app, window, on); whitelist de evenimente [03]
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
    │   ├── fs.handler.ts             [09] CRUD .soardoc / .soardiag / foldere
    │   ├── db.handler.ts             [10] căutare, metadata
    │   └── export.handler.ts         [19] salvare PNG / SVG / PDF / XMI
    ├── settings/
    │   ├── index.ts               ✅ [05] getSettingsStore() → userData/settings.json
    │   ├── settings.ts            ✅ [05] SettingsStore: citire validată, fișier corupt pus deoparte, scriere atomică serializată
    │   └── settings.test.ts       ✅ [05] Node, pe un director temporar
    ├── file-system/
    │   ├── paths.ts                  [07] rezolvare și validare căi în workspace
    │   ├── workspace.ts              [07] .soarws: creare, deschidere, recente
    │   ├── reader.ts                 [07] citire + validare zod
    │   ├── writer.ts                 [07] scriere atomică
    │   ├── watcher.ts                [07] chokidar → evenimente către renderer
    │   ├── entries.ts                [09] arbore de fișiere / foldere
    │   ├── documents.ts              [09] operații .soardoc
    │   ├── diagrams.ts               [09] operații .soardiag
    │   └── naming.ts                 [09] nume unice, sanitizare
    ├── database/
    │   ├── db.ts                     [10] better-sqlite3, conexiune și inițializare
    │   ├── indexer.ts                [10] sincronizare fișiere → index
    │   ├── text-extract.ts           [10] text simplu din TipTap / diagrame
    │   ├── migrations/
    │   │   ├── index.ts              [10]
    │   │   ├── 001_initial.ts        [10] DB per workspace
    │   │   └── app/001_projects.ts   [10] DB la nivel de aplicație
    │   └── repositories/
    │       ├── documents.repo.ts     [10]
    │       ├── diagrams.repo.ts      [10]
    │       ├── projects.repo.ts      [10]
    │       └── search.repo.ts        [10] FTS
    └── export/
        ├── save-file.ts              [19] dialog de salvare + scriere
        └── svg-to-pdf.ts             [19]
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
├── env.d.ts                       ✅ tipul global window.soar
└── test/
    ├── setup.ts                   ✅ jest-dom + cleanup
    ├── soar-api-mock.ts           ✅ mock complet pentru window.soar, cu emit() [03]   [05*] setări stocate în memorie
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
│   ├── ipc.types.ts               ✅ IpcInvokeContract, IpcEventContract, SoarApi [03]   [05*] settings, system, set-zoom
│   ├── editor.types.ts            ✅ [04] FileKind, EditorTabRef, EditorContribution
│   ├── layout.types.ts            ✅ [04] PanelId, PanelMode, PanelPreference, PanelState, PanelLayout
│   ├── ui.types.ts                ✅ [04] ModalId
│   ├── settings.types.ts          ✅ [05] AppSettings, SettingsPatch (DeepPartial), ThemePreference, ResolvedTheme, AccentColor
│   ├── workspace.types.ts            [07]
│   ├── document.types.ts             [09]
│   └── diagram.types.ts              [17]
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
│   ├── file-extensions.ts            [09] .soarws, .soardoc, .soardiag
│   └── shortcuts.ts                  [20] registrul de scurtături
└── editor/
    ├── EditorContributionsProvider.tsx  ✅ [04] context + useEditorContribution(kind); kind duplicat → eroare
    └── tests/                           ✅
```

### 4.3 `store/` — stare globală (Zustand)

```
src/store/
├── index.ts                       ✅ [04]
├── ui.store.ts                    ✅ [04] panouri (visible / width / overlayOpen), lastOverlay, panelResizing,
│                                     modal activ   [05*] resolvedTheme, hydratePanels   [06*] toast
├── tests/                         ✅ ui.store
├── status.store.ts                   [06] segmentele status bar-ului
├── workspace.store.ts                [07] workspace curent, arbore, folder țintă
└── editor.store.ts                   [08] tab-uri, tab activ, dirty   [11*] [17*]
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
│   │   ├── NewMenu.tsx                           [08] split-button „New”   [17*]
│   │   ├── FileTree.tsx                          [08] listă virtualizată
│   │   ├── FileTreeNode.tsx                      [08]
│   │   ├── TreeGuides.tsx                        [08] liniile de ghidaj
│   │   ├── SidebarFooter.tsx                     [08]
│   │   ├── InlineRename.tsx                      [09]
│   │   ├── ConfirmDeleteModal.tsx                [09]
│   │   └── TreeContextMenu.tsx                   [20]
│   ├── hooks/
│   │   ├── useWorkspace.ts                       [07]
│   │   └── useFileActions.ts                     [09]
│   └── utils/
│       └── flatten-tree.ts                       [08]
│
├── editor/                                       [11] tab system + EditorPane
│   ├── index.ts
│   ├── components/
│   │   ├── EditorTabs.tsx
│   │   ├── EditorTab.tsx
│   │   ├── TabOverflowMenu.tsx
│   │   ├── EditorPane.tsx                        randează contribuția după FileKind
│   │   ├── EditorErrorBoundary.tsx
│   │   ├── UnsavedChangesModal.tsx
│   │   ├── WelcomeScreen.tsx
│   │   └── TabContextMenu.tsx                    [20]
│   └── hooks/
│       ├── useEditorTabs.ts
│       └── useHorizontalOverflow.ts
│
├── document-editor/                              [12] TipTap
│   ├── index.ts                                  contribuția pentru `soardoc`
│   ├── components/
│   │   ├── DocumentEditor.tsx
│   │   ├── DocumentTitle.tsx
│   │   ├── Toolbar.tsx                           slot TitleBar, respectă densitatea
│   │   ├── DocumentInspector.tsx
│   │   ├── DocumentStatusItems.tsx
│   │   └── extensions/index.ts                   extensii TipTap custom
│   ├── hooks/
│   │   ├── useDocumentEditor.ts
│   │   ├── useDocumentFile.ts
│   │   └── useAutosave.ts
│   ├── utils/word-count.ts
│   └── styles/prose.css
│
├── diagram-editor/                               [13–19] React Flow + Mermaid
│   ├── index.ts                                  contribuția pentru `soardiag`
│   ├── components/
│   │   ├── DiagramEditor.tsx                     [13]   [18*] comutare canvas / Mermaid
│   │   ├── DiagramCanvas.tsx                     [13]
│   │   ├── DiagramStatusItems.tsx                [13]
│   │   ├── NodePalette.tsx                       [15]
│   │   ├── PropertiesPanel.tsx                   [16]
│   │   ├── MermaidEditor.tsx                     [18]
│   │   ├── canvas/
│   │   │   ├── CanvasHint.tsx                    [13]
│   │   │   ├── CanvasMinimap.tsx                 [13]
│   │   │   ├── ZoomControls.tsx                  [13]
│   │   │   └── CanvasContextMenu.tsx             [20]
│   │   ├── nodes/
│   │   │   ├── index.ts                          [14]
│   │   │   ├── BaseNode.tsx                      [14] card / outline / solid
│   │   │   ├── node-skin.ts                      [14]
│   │   │   ├── NodeHandles.tsx                   [14]
│   │   │   ├── NodeSelectionChrome.tsx           [14]
│   │   │   ├── TriggerNode.tsx                   [14]
│   │   │   ├── ActionNode.tsx                    [14]
│   │   │   ├── DecisionNode.tsx                  [14] romb
│   │   │   ├── IntegrationNode.tsx               [14]
│   │   │   ├── ElementNode.tsx                   [14] elemente UML generice
│   │   │   ├── ShapeNode.tsx                     [15] rect / ellipse
│   │   │   └── NodeContextMenu.tsx               [20]
│   │   ├── edges/
│   │   │   ├── index.ts                          [14]
│   │   │   ├── SoarEdge.tsx                      [14] curved / orthogonal / straight
│   │   │   └── EdgeMarkers.tsx                   [14]
│   │   ├── toolbar/
│   │   │   ├── DiagramToolbar.tsx                [15] slot TitleBar
│   │   │   ├── StyleControls.tsx                 [15]
│   │   │   ├── StylePopover.tsx                  [15] densitatea `compact`
│   │   │   ├── HistoryButtons.tsx                [15]
│   │   │   └── ExportMenu.tsx                    [19] slot TitleActions
│   │   ├── properties/                           [16]
│   │   │   ├── NodeProperties.tsx
│   │   │   ├── NodeIdentity.tsx
│   │   │   ├── EdgeProperties.tsx
│   │   │   ├── MultiSelectionProperties.tsx
│   │   │   ├── EmptySelection.tsx
│   │   │   └── Field.tsx
│   │   ├── new-diagram/                          [17] dialogul „New diagram”
│   │   │   ├── NewDiagramDialog.tsx
│   │   │   ├── DialogHeader.tsx
│   │   │   ├── DialogFooter.tsx
│   │   │   ├── CategoryList.tsx
│   │   │   ├── DiagramTypeGrid.tsx
│   │   │   ├── DiagramTypeCard.tsx
│   │   │   ├── DiagramSketch.tsx
│   │   │   └── DestinationPicker.tsx
│   │   └── mermaid/                              [18]
│   │       ├── MermaidSourcePane.tsx
│   │       ├── MermaidPreview.tsx
│   │       ├── MermaidError.tsx
│   │       └── LineNumbers.tsx
│   ├── store/                                    stare locală modulului
│   │   ├── diagram.store.ts                      [13] noduri, muchii, selecție
│   │   ├── DiagramStoreProvider.tsx              [13] un store per tab
│   │   ├── store-registry.ts                     [13]
│   │   ├── history.ts                            [15] undo / redo
│   │   └── tool.store.ts                         [15] unealta activă
│   ├── hooks/
│   │   ├── useDiagram.ts                         [13]
│   │   ├── useNodeTypes.ts                       [14]
│   │   ├── useHotEdges.ts                        [14]
│   │   ├── useCanvasInteractions.ts              [15]
│   │   ├── useDiagramShortcuts.ts                [15]
│   │   ├── useSelectedElements.ts                [16]
│   │   ├── useCommitOnFocus.ts                   [16]
│   │   ├── useTagSuggestions.ts                  [16]
│   │   ├── useCreateDiagram.ts                   [17]
│   │   ├── useMermaidRender.ts                   [18]
│   │   └── useExportDiagram.ts                   [19]
│   ├── constants/
│   │   ├── node-kinds.ts                         [14]
│   │   ├── node-palette.ts                       [14] paleta semantică de 6 culori (date, nu temă)
│   │   ├── tools.ts                              [15]
│   │   ├── diagram-catalog.ts                    [17] catalogul UML
│   │   ├── diagram-sketches.ts                   [17]
│   │   └── diagram-starters.ts                   [17]
│   ├── utils/
│   │   ├── graph-mapping.ts                      [13] .soardiag ↔ React Flow
│   │   ├── node-factory.ts                       [15]
│   │   ├── build-starter-graph.ts                [17]
│   │   ├── filter-catalog.ts                     [17]
│   │   └── clipboard.ts                          [20]
│   ├── mermaid/                                  [18]
│   │   ├── mermaid-loader.ts                     import leneș
│   │   ├── templates.ts
│   │   └── theme-variables.ts
│   ├── export/                                   [19]
│   │   ├── export-formats.ts
│   │   ├── export-canvas.ts
│   │   ├── export-mermaid.ts
│   │   └── xmi/
│   │       ├── serialize-xmi.ts
│   │       └── class.xmi.ts
│   └── styles/
│       ├── react-flow.css                        [13]
│       └── nodes.css                             [14]
│
└── search/                                       [20] Ctrl+K
    ├── index.ts
    ├── components/
    │   ├── GlobalSearch.tsx
    │   ├── SearchResultRow.tsx
    │   └── HighlightedSnippet.tsx
    ├── hooks/useSearch.ts
    └── utils/group-results.ts
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
│   │   ├── IconButton.tsx         ✅
│   │   ├── SplitButton.tsx        ✅
│   │   ├── ControlPill.tsx        ✅
│   │   ├── Input.tsx              ✅
│   │   ├── SearchInput.tsx        ✅
│   │   ├── Textarea.tsx           ✅
│   │   ├── Toggle.tsx             ✅
│   │   ├── SegmentedControl.tsx   ✅
│   │   ├── Swatch.tsx             ✅
│   │   ├── TagInput.tsx           ✅
│   │   ├── Menu.tsx               ✅ flip / shift în viewport
│   │   ├── Modal.tsx              ✅ limitat la viewport
│   │   ├── Tooltip.tsx            ✅
│   │   ├── Divider.tsx            ✅
│   │   ├── Kbd.tsx                ✅
│   │   ├── SectionLabel.tsx       ✅
│   │   ├── EmptyState.tsx         ✅
│   │   ├── Toast.tsx                 [06]
│   │   ├── ContextMenu.tsx           [20]
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
│       ├── tests/                 ✅ TitleBar, AppShell, SidePanel, PanelResizeHandle, ModalHost
│       ├── AppShell.tsx           ✅ [04] gridul ferestrei; coloane din PanelLayout
│       ├── SidePanel.tsx          ✅ [04] docked / overlay: poziție, animație, focus, Escape
│       ├── PanelResizeHandle.tsx  ✅ [04] generic, pointer + tastatură   [18*] refolosit pentru split view
│       ├── Sidebar.tsx            ✅ [04] cadrul panoului stâng
│       ├── InspectorPanel.tsx     ✅ [04] header „Properties” + închidere
│       ├── ModalHost.tsx          ✅ [04] modalul activ din ui.store
│       ├── StatusBar.tsx          ✅ [04] containerul de 24px   [06*] conținut
│       ├── ToastViewport.tsx         [06]
│       └── ShortcutsHelp.tsx         [20]
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
│   ├── useUiZoom.ts               ✅ [05] Ctrl/Cmd + = / - / 0, trepte 80–150%
│   ├── tests/                     ✅ [05] useTheme, useLayoutPersistence, useUiZoom
│   ├── useDebounce.ts                [12]
│   └── useKeyboard.ts                [15]   [20*]
└── utils/
    ├── cn.ts                      ✅
    ├── floating-position.ts       ✅
    ├── truncate-middle.ts         ✅
    ├── tests/                     ✅ cn, floating-position, truncate-middle, panel-layout, apply-theme
    ├── panel-layout.ts            ✅ [04] resolvePanelLayout (funcție pură)
    ├── apply-theme.ts             ✅ [05] resolveTheme, applyTheme (data-theme, --accent), readTitleBarColors
    ├── platform.ts                   [06]
    └── color.ts                      [14]
```

### 4.6 `styles/`

```
src/styles/
├── globals.css                    ✅ Tailwind v4 + @theme, fonturi locale, bază
│                                     [03*] utilitarele app-drag / app-no-drag + no-drag automat pe elementele interactive
│                                     [04*] animațiile sertarelor, cursorul global în timpul redimensionării
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
