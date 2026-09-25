# 17 — Dialogul „New diagram” (catalog UML)

## Scop
Modalul de creare a diagramelor din prototip: catalogul celor 14 tipuri UML 2.5 pe categorii, cu schițe, căutare, alegerea folderului de destinație și crearea cu noduri de pornire.
Înlocuiește fallback-ul temporar din plan 09.

## Referință design
- **Overlay:** `--overlay` + blur 2px, z-index 50. Mousedown pe fundal închide modalul.
- **Modal:** 940×712 (limitat la `min(940px, 92vw)` × `min(712px, 90vh)`), r8, fundal bg, border, shadow-modal.

**Header (h52, gap 12, padding 0 16, border-bottom)**
- „New diagram” 14px 600.
- Subtitlu 12px text2: „Choose a UML type — Archon scaffolds the notation and shapes for you.” (numele aplicației vine din `APP_NAME`).
- În dreapta:
  - `SearchInput` 220px „Search diagram types”;
  - buton close 28×28.

**Coloana de categorii (190px, fundal side, border-right, padding 12 8, gap 2)**
- Eticheta „CATEGORY” 10px 600, letter-spacing .6px, text3.
- Rânduri h30 r4 gap 8, cu iconiță 14 și contor mono 10 (dreapta):
  - „All UML types” (grid4, 14);
  - „Structural” (layers, 7);
  - „Behavioral” (play, 7).
- Rândul activ: accent-soft, `inset 2px 0 0 accent`, text; contorul în accent-text.
- Jos (border-top, padding 10 8 0): „Every type ships with its own shape palette and UML 2.5 well-formedness checks.” (11px text2).
  **Atenție:** verificările de well-formedness nu sunt în scopul acestui plan. Textul se ajustează, sau rămâne dacă se planifică funcția (decizie de produs).

**Grila (padding 16 18, scroll)**
- Grupuri „STRUCTURAL” („what the system is made of”) și „BEHAVIORAL” („what the system does over time”).
- Header de grup: titlu 11px 600 .6px text2, linie flex-1 border, notă 11px text3, mb10.
- Grilă `repeat(auto-fill, minmax(160px, 1fr))`, gap 12, mb18. La lățimea din design rezultă cele 4 coloane din prototip.
- **Card:**
  - r6, border (accent dacă e selectat), fundal surface2, padding 8;
  - selectat: `box-shadow: 0 0 0 3px` accent la 16%;
  - schiță: h54, r4, fundal bg cu puncte `var(--dot)` la 11px, mb8; SVG 160×54 cu stroke 1.2 (accent dacă e selectat, altfel text2);
  - nume 12px 600; descriere 10px text2;
  - badge de selecție 18px accent în colț (top/right -7), cu bifă.
- **Stare goală:** „No diagram type matches “q”” (padding 40, 12px text3).

**Footer (h56, fundal side, border-top, gap 12, padding 0 16)**
- „Selected” și chip-ul (h22, accent-soft, accent-text, 11px 500) „<Type> diagram”.
- „saves to” și un segmented control cu toate căile de foldere (scroll orizontal, max 380px).
- În dreapta: „Cancel” (secondary) și „Create diagram” (primary) cu `Kbd` ⏎.

**Responsive** (`@container modal`, plan 02)
- Modalul se limitează la `min(940px, 100vw - 32px)` × `min(712px, 100vh - 32px)`; header-ul și footer-ul rămân fixe, iar grila are scroll.
- Sub 760px: coloana de categorii devine un `SegmentedControl` orizontal („All · Structural · Behavioral”, cu contoare) sub header; nota de jos se ascunde.
- Sub 600px: câmpul de căutare trece pe un rând separat, pe toată lățimea; subtitlul are ellipsis.
- Sub 720px: footer-ul are două rânduri (tipul selectat și „saves to” sus, butoanele jos, aliniate la dreapta), cu `height: auto`.
- „saves to” are `max-width: 100%` și scroll orizontal propriu; calea selectată se aduce în vizor.

**Comportament**
- Click pe card = selectează tipul. Dublu-click = selectează și creează.
- Enter = creează. Escape = închide.
- La creare:
  - fișier `<type>-N.ardiag` în folderul ales, cu nodurile de pornire (`STARTERS` pentru class / sequence / state / usecase / activity; altfel „<Type> A” / „<Type> B”);
  - poziții `x = 180 + i*300`, `y = 260 + i*70`; muchie N1→N2;
  - folderul se expandează, tab-ul se deschide, N1 e selectat, istoricul e gol;
  - toast „<Type> diagram created in <path>/”.
- Destinația implicită este `workspace.store.targetFolder`. Schimbarea ei în dialog actualizează și ținta globală.

## Dependențe
- Plan 16.
- Fără pachete npm noi.

## Fișiere
- `src/core/types/diagram.types.ts` (modificat): `UmlDiagramType` (14 id-uri) și `DiagramType = 'flowchart' | UmlDiagramType`. Schema din plan 09 se actualizează în același pas.
- `src/modules/diagram-editor/constants/diagram-catalog.ts`: `DIAGRAM_TYPES` (`id`, `category`, `name`, `description`, `icon`), `DIAGRAM_CATEGORIES`.
- `src/modules/diagram-editor/constants/diagram-sketches.ts`: `SKETCHES` (primitive `rect` / `circle` / `ellipse` / `path`, copiate din prototip, tipate ca union discriminat).
- `src/modules/diagram-editor/constants/diagram-starters.ts`: `STARTERS` (convertite în `DiagramNodeType` + `data`).
- `src/modules/diagram-editor/utils/filter-catalog.ts`: filtrare după categorie și query (nume + descriere, case-insensitive), cu gruparea rezultatelor.
- `src/modules/diagram-editor/utils/build-starter-graph.ts`
- `src/modules/diagram-editor/hooks/useCreateDiagram.ts`: mutația `fs:create-diagram`, apoi efectele (expandare, tab, selecție, toast).
  **Selecția inițială:** store-ul diagramei nu există încă la creare, așa că id-ul nodului de selectat se transmite prin `editor.store` (`pendingSelection` pe tab).
  Store-ul îl consumă la montare.
- `src/modules/diagram-editor/components/new-diagram/NewDiagramDialog.tsx`: compune modalul și ține starea locală (categorie, query, tip selectat).
- `src/modules/diagram-editor/components/new-diagram/DialogHeader.tsx`
- `src/modules/diagram-editor/components/new-diagram/CategoryList.tsx`: prop `variant: 'column' | 'tabs'`, ales prin container query (ambele randate, una ascunsă din CSS, ca să nu depindă de măsurători JS).
- `src/modules/diagram-editor/components/new-diagram/DiagramTypeGrid.tsx`: grupuri și navigare cu săgeți în grilă (`role="listbox"`).
- `src/modules/diagram-editor/components/new-diagram/DiagramTypeCard.tsx`
- `src/modules/diagram-editor/components/new-diagram/DiagramSketch.tsx`
- `src/modules/diagram-editor/components/new-diagram/DialogFooter.tsx`
- `src/modules/diagram-editor/components/new-diagram/DestinationPicker.tsx`: folderele din tree (query-ul workspace-ului, citit prin ipc-client).
  Contextul e `ipc-client` + `workspace.store`; nu se importă din `modules/workspace`.
- `src/modules/diagram-editor/index.ts` (modificat): exportă `NewDiagramDialog`.
- `src/App.tsx` (modificat): `ModalHost modals={{ 'new-diagram': NewDiagramDialog }}`.
- `src/modules/workspace/components/NewMenu.tsx` (modificat): „New diagram…” deschide modalul. Fallback-ul și `TODO(plan-17)` se elimină.
- `src/store/editor.store.ts` (modificat): `pendingSelection`.

## Pași
1. Tipurile UML, actualizarea schemei zod și JSON, plus teste.
2. `diagram-catalog.ts`, `diagram-sketches.ts`, `diagram-starters.ts`.
   Test: fiecare tip din catalog are o schiță; contoarele pe categorie sunt 7 / 7 / 14.
3. `filter-catalog.ts` și teste.
4. `build-starter-graph.ts` și teste: pozițiile, muchia N1→N2, fallback-ul A/B.
5. `DiagramSketch` și `DiagramTypeCard`.
6. `CategoryList`, `DiagramTypeGrid` (cu starea goală), `DialogHeader`, `DestinationPicker`, `DialogFooter`.
7. `NewDiagramDialog`:
   - Enter / Escape doar când modalul e deschis;
   - focus inițial în câmpul de căutare.
8. `useCreateDiagram` și `pendingSelection`.
9. Înregistrarea în `ModalHost` și legarea celor trei puncte de intrare: split button „New”, meniul „New diagram…” și „+” din tab bar.
10. Teste:
    - filtrarea după „seq” lasă doar Sequence;
    - categoria Behavioral ascunde grupul Structural;
    - dublu-click creează (mutație apelată cu tipul corect și folderul-țintă);
    - Enter creează; Escape și click pe fundal închid.
11. Verificare vizuală la 720×480: categoriile apar ca tab-uri, grila are 2–3 coloane, iar butonul „Create diagram” e vizibil fără scroll.

## Criterii de acceptare
- Modalul e identic vizual cu prototipul, cu toate cele 14 schițe.
- Crearea unei diagrame „State machine” în `Playbooks/` produce un fișier valid, cu nodurile „New” și „Contained”, deschis și cu N1 selectat.
- Niciun fișier din `new-diagram/` nu depășește 200 de linii.
- Dialogul e complet utilizabil de la 720×480 până la 2560×1440.

## Commit
`feat(diagram-editor): new diagram dialog with UML catalog`

## În afara scopului
- Palete de forme specifice fiecărui tip UML.
- Validarea well-formedness UML (plan viitor, care ar justifica textul din footer-ul coloanei).
