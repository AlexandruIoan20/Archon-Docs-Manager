# 13 — Diagram canvas (React Flow)

## Scop
Canvas-ul de diagramă peste React Flow: încărcare și salvare `.soardiag`, grila de puncte, controalele de zoom, minimap-ul și starea per tab.
Nodurile sunt deocamdată cele implicite; aspectul SOAR vine în plan 14.

## Referință design
- **Canvas:** flex-1, fundal `--canvas`, puncte `radial-gradient(var(--dot) 1.2px, transparent 1.2px)` la 22px.
  Zoom inițial 87% în prototip; noi folosim `fitView` la prima deschidere și viewport-ul salvat după aceea.
- **Zoom controls (stânga-jos, 16/16):**
  - container h28, p2, r6, surface, border, gap 2;
  - buton − 24×24; eticheta procentului mono 11px, lățime 44 (click → 100%); buton + 24×24;
  - interval 30%–200%, pas 10%.
- **Minimap (dreapta-jos, 16/16):**
  - 120×80, r6, fundal side, border, `overflow: hidden`;
  - nodurile ca dreptunghiuri colorate cu `data.color`, r2;
  - nodul selectat are inel accent 1.5px.
- **Responsive** (dimensiunea canvas-ului, măsurată cu `useElementSize`):
  - minimap-ul se ascunde sub 560px lățime sau 360px înălțime; un buton mic din `ZoomControls` îl poate reafișa temporar;
  - hint-ul are `max-width: calc(100% - 32px)` și ellipsis; sub 640px lățime urcă la `bottom: 56px`, ca să nu se suprapună cu controalele de zoom;
  - redimensionarea canvas-ului (fereastră, panouri) **nu** schimbă viewport-ul salvat și nici nu marchează fișierul `dirty`;
  - la prima deschidere, `fitView` folosește `padding: 0.12` și se calculează după prima măsurare a containerului, nu înainte.
- **Hint pill (centru-jos, bottom 20):** h28, padding 0 12, r14, accent-soft, border accent-border, text accent-text 12px. Textul vine din plan 15.
- **Status bar:** „N nodes · M edges”, „Selection: <id> | —”, zoom „87%”.

## Dependențe
- Plan 11.
- npm: `@xyflow/react` (bundled, `-D`).

## Decizii
- **Store per tab.** `createDiagramStore(initial)` (Zustand vanilla) conține `nodes`, `edges`, `viewport`, `selection` și metadatele diagramei.
  Un `DiagramStoreProvider` îl oferă prin context sub-arborelui tab-ului. Toolbar-ul, inspector-ul și status bar-ul (sloturi diferite) îl găsesc printr-un registru local modulului, `Map<tabId, Store>`.
  Motivul: mai multe diagrame deschise simultan, fără stare globală amestecată.
- **Mod controlat.** React Flow e folosit controlat (`nodes`/`edges` din store, cu `applyNodeChanges` / `applyEdgeChanges` în store).
- **Tipuri stabile.** `nodeTypes` și `edgeTypes` sunt constante definite în afara componentelor, ca să evite re-mount-urile.
- **Atribuirea React Flow:** se păstrează link-ul implicit, stilizat discret. Ascunderea lui (`proOptions.hideAttribution`) e rezervată abonaților Pro.

## Fișiere
- `src/modules/diagram-editor/store/diagram.store.ts`: `createDiagramStore`, acțiunile `onNodesChange`, `onEdgesChange`, `setViewport`, `setSelection`, `replaceGraph` și selectori.
- `src/modules/diagram-editor/store/store-registry.ts`: `registerStore(tabId, store)`, `useDiagramStoreFor(tabId, selector)`.
- `src/modules/diagram-editor/store/DiagramStoreProvider.tsx`
- `src/modules/diagram-editor/hooks/useDiagram.ts`: load (React Query `fs:read-diagram`) → creează store-ul → autosave cu debounce 800ms la schimbări de noduri, muchii sau viewport → `setDirty`, plus handler-ul de save (ca în plan 12).
- `src/modules/diagram-editor/utils/graph-mapping.ts`: fișier ↔ stare, cu normalizare (câmpuri `null` → implicite).
- `src/modules/diagram-editor/components/DiagramCanvas.tsx`: `ReactFlowProvider` + `ReactFlow`, cu `Background` (`variant="dots"`, `gap={22}`, `size={1.2}`, `color="var(--dot)"`).
- `src/modules/diagram-editor/components/canvas/ZoomControls.tsx`: folosește `useReactFlow().zoomTo` / `useViewport`.
- `src/modules/diagram-editor/components/canvas/CanvasMinimap.tsx`: `MiniMap` din React Flow, stilizat (`nodeColor`, `maskColor`, `nodeBorderRadius`), sau randare proprie dacă stilizarea nu ajunge la design.
- `src/modules/diagram-editor/components/canvas/CanvasHint.tsx`: prezentațional.
- `src/modules/diagram-editor/components/DiagramEditor.tsx`: `Editor` din contribuție (provider + canvas + overlay-uri).
- `src/modules/diagram-editor/components/DiagramStatusItems.tsx`: contoare, selecție, zoom.
- `src/modules/diagram-editor/styles/react-flow.css`: importă `@xyflow/react/dist/base.css` și suprascrie variabilele `--xy-*` cu tokenurile aplicației (selecție, handle-uri, controale).
- `src/modules/diagram-editor/index.ts`: `diagramEditorContribution` (kind `soardiag`).
- `src/App.tsx` (modificat): înregistrează contribuția.

## Pași
1. `npm i -D @xyflow/react`.
2. `graph-mapping.ts` și teste (round-trip fișier → stare → fișier fără pierderi).
3. `diagram.store.ts` și teste (schimbări de noduri, selecție, `replaceGraph`).
4. `store-registry.ts` și provider. Store-ul se șterge din registru când tab-ul se închide.
5. `useDiagram`, cu autosave. Schimbările de tip `select` și `dimensions` **nu** marchează fișierul `dirty`.
6. `DiagramCanvas`:
   - `minZoom 0.3`, `maxZoom 2`;
   - `defaultViewport` din fișier, sau `fitView` dacă viewport-ul e implicit;
   - `onMoveEnd` → `setViewport`;
   - `deleteKeyCode={null}` (ștergerea e tratată în plan 15);
   - `selectionOnDrag`; `panOnDrag` pe butonul din mijloc și pe dreapta (unealta Pan vine în plan 15).
7. `react-flow.css`.
8. `ZoomControls`, `CanvasMinimap` și `CanvasHint` (fără text încă), cu regulile responsive de mai sus.
   Test: la 500px lățime, minimap-ul nu se randează.
9. `DiagramStatusItems`: segmentul de zoom din status bar (plan 06) vine de aici.
10. Contribuția și înregistrarea ei. Deschiderea unui `.soardiag` din arbore afișează canvas-ul cu nodurile implicite.
11. Teste:
    - încărcarea unei diagrame produce N noduri în store;
    - zoom +/− respectă limitele;
    - autosave după mutarea unui nod (mock pe mutație).

## Criterii de acceptare
- Diagrama `phishing-triage` (6 noduri, 5 muchii) se încarcă, se poate muta, zoom-a și panorama, iar viewport-ul se păstrează după redeschidere.
- Două diagrame deschise în tab-uri diferite nu își amestecă starea.
- Grila, controalele de zoom și minimap-ul corespund vizual prototipului.
- La 720×480, overlay-urile canvas-ului nu se suprapun, iar deschiderea/închiderea inspector-ului nu mută diagrama și nu o marchează `dirty`.

## Commit
`feat(diagram-editor): react flow canvas with per-tab store and autosave`

## În afara scopului
Aspectul nodurilor (plan 14), uneltele (plan 15), panoul de proprietăți (plan 16).
