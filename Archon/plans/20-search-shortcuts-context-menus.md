# 20 — Global search, shortcuts, context menus

## Scop
Faza 5 (polish) din roadmap:
- căutarea globală `Ctrl/Cmd+K` peste indexul SQLite;
- un registru central de shortcut-uri, cu ecran de ajutor;
- meniuri contextuale pentru arbore, tab-uri, canvas și noduri;
- copy / paste / duplicate pentru noduri.

## Referință design
Prototipul nu are aceste ecrane. Ele se construiesc exclusiv din primitivele existente, pentru consistență:
- **Paleta de căutare:** `Modal` 640×auto (max 480px înălțime), poziționat la 12vh de sus.
  - Responsive: `width: min(640px, 100vw - 32px)`, `top: min(12vh, 96px)`, `max-height: min(480px, 100vh - top - 16px)`; lista are scroll, iar câmpul și footer-ul rămân fixe.
  - Căile din rezultate se trunchiază la mijloc; sub 480px (container query) footer-ul cu `Kbd` se ascunde.
  - Câmp de căutare mare: h44, fără border, cu iconiță search 16.
  - Listă grupată: „Files”, „Nodes”, „Content”, cu antete în stilul „CATEGORY” din plan 17.
  - Rândul activ: accent-soft + `inset 2px 0 0 accent`, ca în arbore.
  - Snippet-urile au potrivirea evidențiată în accent-text.
  - Footer cu `Kbd`: ↑↓ navigate · ⏎ open · esc close.
- **Meniu contextual:** `Menu` din plan 02, poziționat la cursor (`placement: 'point'`), cu flip/shift la marginile ferestrei și submeniuri („Change type ▸”) care se deschid spre stânga când nu încap în dreapta. Item-urile periculoase folosesc `--danger`.
- **Ecranul de shortcut-uri** (`Ctrl/Cmd+/`): `Modal` cu tabel de două coloane (acțiune, `Kbd`), grupat pe scope.
  Peste 900px de container, grupurile se așază pe două coloane; sub 480px, combinația trece sub numele acțiunii.
  Shortcut-urile de zoom (plan 05) și de panouri (plan 04) apar și ele aici.

## Dependențe
- Planurile 10 și 19.
- Fără pachete npm noi.

## Fișiere

### Căutare
- `src/modules/search/hooks/useSearch.ts`: `useQuery(['search', q])` cu debounce 150ms și `placeholderData: keepPreviousData`. Minimum 2 caractere.
- `src/modules/search/utils/group-results.ts`
- `src/modules/search/components/GlobalSearch.tsx`: modalul, înregistrat ca `ModalId` `'command-palette'`.
- `src/modules/search/components/SearchResultRow.tsx`
- `src/modules/search/components/HighlightedSnippet.tsx`: parsează marcajele din `snippet()` fără `dangerouslySetInnerHTML`.
- `src/modules/search/index.ts`
- **Deschiderea unui rezultat de tip nod:** `editor.store.openFile` + `pendingSelection` (din plan 17), iar store-ul diagramei centrează viewport-ul pe nod (`fitView({ nodes: [id] })`).

### Shortcut-uri
- `src/core/constants/shortcuts.ts`: `SHORTCUTS` (id, combinație, scope `global | tree | diagram | document`, descriere). Sursă unică pentru handler-e, tooltip-uri și ecranul de ajutor.
- `src/shared/hooks/useKeyboard.ts` (modificat): `useShortcut(id, handler, { enabled })`, citind combinația din `SHORTCUTS`.
- `src/shared/components/layout/ShortcutsHelp.tsx`: `ModalId` `'shortcuts-help'`.
- `App.tsx` (modificat): shortcut-urile ad-hoc din planurile 04, 11 și 15 se mută pe `useShortcut`.

### Meniuri contextuale
- `src/shared/components/ui/ContextMenu.tsx`: `useContextMenu()` → `{ open(event, items), element }`, construit pe `Menu`.
- `src/modules/workspace/components/TreeContextMenu.tsx`:
  - New document / New diagram… / New folder (aici);
  - Rename;
  - Reveal in file manager / Copy relative path;
  - Delete.
- `src/modules/editor/components/TabContextMenu.tsx`: Close / Close others / Close to the right / Reveal in sidebar / Copy path.
- `src/modules/diagram-editor/components/canvas/CanvasContextMenu.tsx`: Add Trigger / Action / Decision / Integration here, Paste, Fit view, Reset zoom.
- `src/modules/diagram-editor/components/nodes/NodeContextMenu.tsx`: Duplicate, Copy, Copy id, Change type ▸, Delete.

### Clipboard
- `src/modules/diagram-editor/utils/clipboard.ts`: serializare JSON cu tip MIME propriu (`application/x-soar-nodes`, cu fallback text).
  Id-urile se remapează la paste, cu offset de +24px la fiecare paste repetat.

## Pași
1. `shortcuts.ts` și `useShortcut`. Mută shortcut-urile existente.
   Test: conflictele (aceeași combinație în același scope) aruncă eroare în dev.
2. `ShortcutsHelp` și tooltip-urile din `IconButton`, care afișează combinația din registru.
3. `group-results.ts` și test.
4. `useSearch`, `HighlightedSnippet` (cu test anti-XSS: `<img onerror>` în conținut rămâne text), `SearchResultRow`, `GlobalSearch`.
   Navigare cu tastatura, iar Enter deschide.
5. `Ctrl/Cmd+K` deschide paleta de oriunde, inclusiv din editorul de documente.
6. Deschiderea rezultatelor: fișier, nod (cu centrare) și conținut de document (cursorul se poziționează la prima potrivire, dacă TipTap permite; altfel doar deschidere).
7. `ContextMenu`: poziționare care nu iese din fereastră, Escape, click în afară, navigare cu săgeți.
8. `TreeContextMenu`. Acțiunile reutilizează `useFileActions` din plan 09.
9. `TabContextMenu`.
10. `clipboard.ts` și teste (remapare de id-uri, păstrarea muchiilor interne, eliminarea celor externe).
    `Ctrl+C` / `Ctrl+V` / `Ctrl+D` în scope-ul `diagram`, cu snapshot în istoric.
11. `CanvasContextMenu` (adăugare la poziția cursorului, convertită cu `screenToFlowPosition`) și `NodeContextMenu`.
12. **Legătura documente ↔ diagrame** (din plan 12): în `DocumentInspector`, „Link diagram” deschide paleta filtrată pe `.ardiag`, iar alegerea adaugă id-ul în `linkedDiagrams`.
13. Teste:
    - paleta afișează grupurile și deschide nodul corect;
    - meniul arborelui apelează rename / delete;
    - paste-ul creează noduri cu id-uri noi.

## Criterii de acceptare
- `Ctrl/Cmd+K` → „isolate” → Enter deschide `phishing-triage` cu nodul „Contain Host” selectat și centrat.
- Toate shortcut-urile sunt listate în `Ctrl/Cmd+/` și provin din registru.
- Paleta, ecranul de shortcut-uri și meniurile contextuale rămân complet vizibile la 720×480, inclusiv deschise lângă marginile ferestrei.
- Click dreapta funcționează pe rândurile arborelui, pe tab-uri, pe canvas și pe noduri, cu acțiuni funcționale.
- Faza 5 din roadmap e completă.

## Commit
Poate fi împărțit în trei commit-uri:
- `feat(search): global command palette over workspace index`
- `feat(shortcuts): central shortcut registry and help overlay`
- `feat(context-menus): context menus and node clipboard`

## În afara scopului
Căutare cu expresii regulate, înlocuire globală, comenzi arbitrare în paletă (în stilul VS Code).
