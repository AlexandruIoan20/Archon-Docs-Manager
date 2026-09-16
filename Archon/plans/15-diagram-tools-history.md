# 15 — Unelte canvas, stil, undo/redo

## Scop
Bara de unelte a diagramei din TitleBar (`NodePalette`), controalele de stil, istoricul undo/redo și shortcut-urile canvas-ului.
Prototipul e urmat pentru comportament: plasare de nod, conectare, ștergere și toast-uri.

## Referință design
- **Unelte** (grup de 7 butoane 30×30, gap 2, activ = accent-soft + inset accent-border + accent):
  Select (cursor) · Pan (hand) · Add node (plusBox) · Connect (link) · Text · Rectangle · Ellipse.
- **Controale de stil (gap 8):**
  - `STROKE`: punct 12px în culoarea curentă, cu inel accent-border;
  - `FILL`: punct 12px, surface, cu inel text3;
  - greutate: iconiță cu 3 linii, valoarea (`1` | `1.5` | `2` | `3`), chevron;
  - font: `Aa` și un input mono 26px cu valoarea (implicit 13).
- **Undo / redo:** butoane 30×30; culoare text dacă există istoric, altfel text3.
- **Comportamente:**
  - **Add node:** click pe canvas plasează un nod centrat pe cursor (`x-88`, `y-32`, ceea ce înseamnă centrul unui nod de 176×64), îl selectează, revine la Select, toast „Node added”. Cursor `copy`.
  - **Connect:**
    - primul click pe un nod îl setează ca sursă (border accent), iar al doilea click creează muchia și revine la Select, cu toast „Edge created”;
    - click din nou pe sursă anulează;
    - hint: „Click a source node to start an edge” → „Now click the target node”;
    - status bar: „Connecting…”.
  - **Pan:** cursor `grab`, iar tragerea mută viewport-ul.
  - **Click pe canvas gol:** deselectează, anulează conectarea și închide meniurile.
  - **Delete / Backspace** (în afara câmpurilor de text): șterge selecția și muchiile atașate, cu toast „Node deleted — ⌘Z to undo”.
  - **Ctrl/Cmd+Z** = undo, **Ctrl/Cmd+Shift+Z** (și **Ctrl+Y**) = redo.
    Istoricul are maximum 30 de pași. Fără istoric, toast „Nothing to undo” / „Nothing to redo”.
  - **Escape:** anulează conectarea și închide meniurile.

## Dependențe
- Plan 14.

## Decizii
- **Istoricul ține snapshot-uri de `{nodes, edges}`** (fără selecție și viewport), în store-ul diagramei.
  - Snapshot-ul se face **înainte** de: începutul tragerii, add, delete, connect, schimbări de stil și commit de proprietăți (plan 16).
  - Nu se face la fiecare pixel sau tastă.
  - Orice acțiune nouă golește `future`.
- **Istoricul nu se persistă.** Se resetează la deschiderea fișierului, ca în prototip la crearea unei diagrame.
- **Shortcut-urile sunt limitate la tab-ul activ de tip diagramă** și ignorate când focusul e în `input`, `textarea` sau `[contenteditable]`.
- **„Stroke / Fill / Weight / Font”** se aplică nodurilor selectate de tip `shape-*` / `text` și muchiilor selectate.
  Fără selecție, setează valorile implicite pentru următoarele forme desenate.
  Nodurile SOAR folosesc culoarea din Properties (plan 16), nu stroke-ul.
- **Ciclarea prin click din prototip se înlocuiește cu meniuri:**
  - `STROKE`: meniu cu 6 swatch-uri;
  - `FILL`: „None” și paleta la 16%;
  - greutate: meniu cu 4 valori;
  - font: input numeric, clamp 8–72.

## Fișiere
- `src/modules/diagram-editor/store/tool.store.ts` (per tab, în același registru):
  `tool: DiagramTool`, `connectFrom: string | null`, `styleDefaults { stroke, fill, strokeWidth, fontSize }`.
- `src/modules/diagram-editor/store/history.ts`: `createHistory(limit = 30)` cu `snapshot`, `undo`, `redo`, `canUndo`, `canRedo`, `clear`.
  Funcții pure, integrate în `diagram.store`.
- `src/modules/diagram-editor/store/diagram.store.ts` (modificat): `addNode`, `deleteSelection`, `connect(source, target)`, `updateNodeData(id, patch, { commit })`, `applyStyle(patch)`, `undo`, `redo`.
- `src/modules/diagram-editor/utils/node-factory.ts`: `createNode(kind, position, existingIds)`, care generează id-ul `N<k>` unic (cel mai mic număr liber, nu aleator ca în prototip).
- `src/modules/diagram-editor/components/nodes/ShapeNode.tsx` (rect / ellipse) și `TextNode.tsx`, cu redimensionare prin `NodeResizer` din React Flow.
- `src/modules/diagram-editor/components/NodePalette.tsx`: grupul celor 7 unelte. Add node are un chevron mic cu meniu de tipuri (Trigger / Action / Decision / Integration); implicit Action.
- `src/modules/diagram-editor/components/toolbar/StyleControls.tsx`
- `src/modules/diagram-editor/components/toolbar/HistoryButtons.tsx`
- `src/modules/diagram-editor/components/toolbar/DiagramToolbar.tsx`: contribuția `Toolbar` (`NodePalette` │ `StyleControls` │ `HistoryButtons`).
- `src/modules/diagram-editor/hooks/useCanvasInteractions.ts`: `onPaneClick`, `onNodeClick`, `onNodeDragStart`, `onConnect`, cursorul după unealtă și `panOnDrag` pentru Pan.
- `src/modules/diagram-editor/hooks/useDiagramShortcuts.ts`: folosește `shared/hooks/useKeyboard.ts`.
- `src/shared/hooks/useKeyboard.ts`: `useKeyboard(bindings, { enabled, ignoreEditable })` cu combinații `mod+z` (mod = Cmd/Ctrl). Plan 20 îl extinde într-un registru.
- `src/modules/diagram-editor/components/canvas/CanvasHint.tsx` (modificat): textul vine din `tool.store`.

## Pași
1. `history.ts` și teste: limita 30, undo/redo simetric, acțiune nouă golește `future`.
2. `node-factory.ts` și teste: id-uri unice, dimensiuni după tip.
3. Acțiunile noi din `diagram.store`, cu teste pentru add, delete (inclusiv muchiile atașate), connect (fără duplicate și fără auto-legătură) și undo după fiecare.
4. `tool.store.ts`.
5. `useKeyboard` și teste (mod key per platformă, ignorarea câmpurilor editabile).
6. `useCanvasInteractions`, conectat în `DiagramCanvas`:
   - în modul Connect, se folosește `onNodeClick` (fluxul în doi pași din prototip);
   - în modul Select, rămâne activ și drag-ul nativ React Flow din handle-uri.
7. `ShapeNode` și `TextNode`, adăugate în `NODE_TYPES`.
8. `NodePalette`, `StyleControls`, `HistoryButtons`, `DiagramToolbar`. Contribuția primește `Toolbar`.
9. `useDiagramShortcuts`: Delete/Backspace, undo/redo, Escape, plus V / H / N / C / T / R / O pentru unelte (afișate în tooltip).
10. Toast-urile din prototip, prin `ui.store.notify`, cu `modKeyLabel` în mesajul de ștergere.
11. `status.store`: „Connecting…” cât timp `connectFrom` e setat.
12. Teste de integrare (RTL + React Flow în jsdom, cu mock pentru `ResizeObserver`):
    - Add node → click pe canvas → nod nou selectat → unealta revine la Select;
    - Connect în doi pași;
    - Delete → Ctrl+Z restaurează nodul și muchiile.

## Criterii de acceptare
- Toate cele 7 unelte funcționează ca în prototip, iar hint-ul și status bar-ul se actualizează.
- Undo/redo acoperă mutare, adăugare, ștergere, conectare și stil. Butoanele se estompează corect.
- Shortcut-urile nu interferează cu tastarea în Properties sau în editorul de documente.

## Commit
`feat(diagram-editor): canvas tools, style controls and undo/redo`

## În afara scopului
Copy/paste și duplicare (plan 20), aliniere și distribuire (viitor).
