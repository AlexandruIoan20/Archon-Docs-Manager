# 14 — Noduri & muchii SOAR

## Scop
Nodurile custom (Trigger, Action, Decision, Integration, plus elementul generic UML) și muchia custom, cu cele trei stiluri vizuale de nod și cele trei stiluri de muchie din prototip.

## Referință design

### Nod dreptunghiular
- 176×64, conținut r6, gap 10, padding 0 12.
- Iconița într-un pătrat 28×28 r6, iconiță 15.
- Titlu 13px 600 ellipsis; subtitlu 11px ellipsis.

### Decizie (romb)
- 100×100, `clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%)`.
- Conținut pe coloană, centrat, gap 2.
- Contur prin `box-shadow: inset 0 0 0 1.5px rgba(color,.55)`.

### Skin-uri (preferința `nodeStyle`)

| Skin | Fundal | Border | Titlu / subtitlu | Fundal iconiță / culoare iconiță | Rail stânga 3px | Umbră |
|---|---|---|---|---|---|---|
| `card` | surface | 1px `rgba(color,.45)` | text / text2 | `rgba(color,.16)` / color | da | shadow-node |
| `outline` | transparent | 1.5px color | text / text2 | transparent / color | nu | nu |
| `solid` | color | 1px color | #fff / `rgba(255,255,255,.78)` | `rgba(255,255,255,.22)` / #fff | nu | shadow-node |

### Selecție
- 6 handle-uri vizuale 8×8 (colțuri și mijlocul laturilor de sus și de jos), fundal canvas, border 1.5 accent, r2.
- Inel `inset: -6px`, border 1.5 accent, r8.
- Deasupra (top -30, dreapta), grupul:
  - badge cu id (h20, padding 0 7, r4, accent, text on-accent, mono 10px 600);
  - buton de ștergere 20×20 r4 `--danger`, cu iconiță trash 11 albă.
- **Nod „pending” la connect:** border 1.5 accent.
- **Cursor:** `move`, sau `crosshair` când unealta connect e activă.

### Muchie
- Stroke text3 1.6, cu marker săgeată (path `M0 1 9 5 0 9Z`, 6×6).
- **„Hot”** (atinge nodul selectat): stroke accent, `stroke-dasharray: 6 6`, animația `dashflow 1.4s linear infinite`, marker accent.
- **Etichetă:** mono 10px text2, deasupra mijlocului muchiei (ex. „score ≥ 70”).
- **Stiluri (`edgeStyle`):**
  - `curved`: bezier cu offset orizontal `max(40, |dx|*0.6)`;
  - `orthogonal`: trepte cu rază 8;
  - `straight`: linie dreaptă.
- **Ancorare:** din dreapta sursei, în stânga țintei.

### Paleta de noduri (date)
`#7C3AED` (violet), `#2563EB` (albastru), `#D97706` (chihlimbar), `#059669` (verde), `#DC2626` (roșu), `#8892A4` (neutru).

## Dependențe
- Plan 13.

## Fișiere
- `src/modules/diagram-editor/constants/node-palette.ts`: `NODE_PALETTE: readonly { value; name }[]`.
- `src/modules/diagram-editor/constants/node-kinds.ts`: pentru fiecare `DiagramNodeType`: `{ label, defaultIcon, defaultColor, shape: 'rect' | 'diamond', size, supportsRetry }`.
  Exemple: trigger → zap / violet; action → play / albastru; decision → branch / chihlimbar / romb; integration → link / verde; element → box / albastru.
- `src/shared/utils/color.ts`: `hexToRgba(hex, alpha)`, cu test.
- `src/modules/diagram-editor/components/nodes/node-skin.ts`: `getNodeSkin(style, color, { pending })` → obiect de clase și variabile CSS. Funcție pură, testată pentru toate cele 3 skin-uri.
- `src/modules/diagram-editor/components/nodes/BaseNode.tsx`: layout-ul comun, cu culoarea transmisă prin variabilele CSS `--node-color` și `--node-tint`, nu prin stiluri inline repetate.
- `src/modules/diagram-editor/components/nodes/NodeSelectionChrome.tsx`: handle-uri, inel, badge și ștergere. Ștergerea apelează acțiunea din store.
- `src/modules/diagram-editor/components/nodes/NodeHandles.tsx`: `Handle` din React Flow, cu `target` în stânga și `source` în dreapta.
  Invizibile implicit, vizibile la hover sau când unealta connect e activă.
- `src/modules/diagram-editor/components/nodes/TriggerNode.tsx`, `ActionNode.tsx`, `IntegrationNode.tsx`, `ElementNode.tsx`: wrapper-e subțiri peste `BaseNode`.
- `src/modules/diagram-editor/components/nodes/DecisionNode.tsx`: varianta romb.
- `src/modules/diagram-editor/components/nodes/index.ts`: `NODE_TYPES` (constantă `NodeTypes`).
- `src/modules/diagram-editor/components/edges/SoarEdge.tsx`:
  - folosește `getBezierPath` / `getSmoothStepPath({ borderRadius: 8 })` / `getStraightPath` după preferință;
  - `EdgeLabelRenderer` pentru etichetă.
- `src/modules/diagram-editor/components/edges/EdgeMarkers.tsx`: `<svg><defs>` cu markerele `arrow` și `arrow-hot`, montat o singură dată în canvas.
- `src/modules/diagram-editor/components/edges/index.ts`: `EDGE_TYPES`.
- `src/modules/diagram-editor/hooks/useNodeTypes.ts`: returnează `NODE_TYPES` / `EDGE_TYPES` și preferințele de stil.
  Ordinea de prioritate: `diagram.style.*` → setarea aplicației (plan 05) → implicit.
- `src/modules/diagram-editor/hooks/useHotEdges.ts`: marchează muchiile atinse de selecție, derivat din store, fără scriere în fișier.
- `src/modules/diagram-editor/styles/nodes.css`: skin-uri, inel, handle-uri, animația muchiilor (`dashflow` e deja global, din plan 01).

## Pași
1. `node-palette.ts`, `node-kinds.ts`, `color.ts` și testul pentru `color.ts`.
2. `node-skin.ts` și teste.
3. `BaseNode` și `NodeHandles`. Verificare vizuală cu un nod `action`.
4. `NodeSelectionChrome`. React Flow îi dă nodului prop-ul `selected`.
5. Cele cinci tipuri de nod și `NODE_TYPES`, conectate în `DiagramCanvas`. Tipurile `shape-*` și `text` vin în plan 15.
6. `SoarEdge`, `EdgeMarkers` și `EDGE_TYPES`.
   Muchiile noi primesc `type: 'soar'`. `graph-mapping` (plan 13) setează `type` la încărcare.
7. `useHotEdges` și `useNodeTypes`.
8. **Accesibilitate:** fiecare nod primește `aria-label` „<kind> <label>”; React Flow gestionează deja focusul pe noduri.
9. **Performanță:** componentele de nod sunt `memo`, iar selectorii din store sunt granulari.
   Test manual: 300 de noduri se mută fluid.
10. Teste:
    - fiecare tip de nod randează titlul și subtitlul;
    - romb pentru decision;
    - chrome-ul apare doar când nodul e selectat;
    - calea muchiei se schimbă după preferință (snapshot pe atributul `d`).

## Criterii de acceptare
- Diagrama `phishing-triage` arată ca în prototip în skin-ul `card`. Schimbarea preferinței (manual, prin setări) comută corect la `outline` și `solid`.
- Muchiile nodului selectat se animă cu accent. Etichetele „score ≥ 70” și „score < 70” sunt lizibile.
- Nicio culoare de temă hardcodată: doar paleta de noduri e în hex.

## Commit
`feat(diagram-editor): soar node types, skins and custom edges`

## În afara scopului
Crearea și ștergerea interactivă (plan 15), editarea proprietăților (plan 16).
