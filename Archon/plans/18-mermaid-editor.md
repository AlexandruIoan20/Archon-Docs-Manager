# 18 — Mermaid editor

## Scop
Diagrame definite prin text (`engine: "mermaid"`), în special diagrame de secvență, cu previzualizare live.
Cerința vine din specificație. Prototipul nu are un ecran dedicat, așa că UI-ul reutilizează limbajul vizual existent.

## Referință design (derivat)
- **Split view** în zona centrală: editor de text în stânga (40%) și previzualizare în dreapta.
- **Editor de text:**
  - fundal `--bg`, mono 12px, line-height 1.6, padding 16;
  - coloana de numere de linie în text3, cu border-right.
- **Previzualizare:** fundal canvas cu grila de puncte de 22px (ca în plan 13); SVG-ul centrat.
- **Eroare de sintaxă:** pill în stilul hint-ului, dar cu border și text `--danger`, jos-centru, cu linia erorii.
- **Status bar:** „Mermaid · N lines” și zoom-ul previzualizării.
- **Dialogul „New diagram”:** în footer, un `SegmentedControl` „Canvas | Text”, activ doar pentru tipurile pe care Mermaid le suportă: sequence, class, state, activity (→ flowchart), usecase (→ flowchart).

## Dependențe
- Plan 17.
- npm: `mermaid` (bundled, `-D`), încărcat **lazy** cu `import()`, deoarece e mare și nu trebuie să încetinească pornirea.

## Decizii
- **Aceeași contribuție `soardiag`.** `DiagramEditor` alege intern între `DiagramCanvas` și `MermaidEditor`, după `engine`. Nu se adaugă un `FileKind` nou.
- **Inițializare Mermaid:** `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables })`.
  Culorile se citesc din tokenuri cu `getComputedStyle` la fiecare schimbare de temă.
- **Randare:** `mermaid.render(id, source)` cu debounce 300ms.
  Un id unic per randare previne coliziunile între tab-uri.
  Rezultatul se inserează într-un container dedicat. Nivelul `strict` sanitizează SVG-ul, iar CSP-ul permite deja stiluri inline.
- **Editorul de text** e un `<textarea>` cu numerotare de linii sincronizată la scroll. Nu se adaugă CodeMirror; poate veni într-un plan viitor.

## Fișiere
- `src/modules/diagram-editor/mermaid/mermaid-loader.ts`: `loadMermaid()` (singleton lazy) și `renderMermaid(source, themeVars)` → `{ svg } | { error: { message, line } }`.
- `src/modules/diagram-editor/mermaid/theme-variables.ts`: tokenuri → `themeVariables`.
- `src/modules/diagram-editor/mermaid/templates.ts`: sursele de pornire per tip.
  Exemplul pentru sequence folosește actorii din `STARTERS`: `SIEM ->> SOAR Engine: alert`.
- `src/modules/diagram-editor/components/MermaidEditor.tsx`: compune split view-ul.
- `src/modules/diagram-editor/components/mermaid/MermaidSourcePane.tsx`
- `src/modules/diagram-editor/components/mermaid/LineNumbers.tsx`
- `src/modules/diagram-editor/components/mermaid/MermaidPreview.tsx`: cu zoom pe preview (roata + Ctrl, controalele din plan 13 reutilizate).
- `src/modules/diagram-editor/components/mermaid/MermaidError.tsx`
- `src/modules/diagram-editor/hooks/useMermaidRender.ts`
- `src/modules/diagram-editor/components/DiagramEditor.tsx` (modificat): comutarea după `engine`.
- `src/modules/diagram-editor/components/toolbar/DiagramToolbar.tsx` (modificat): pentru Mermaid ascunde uneltele de canvas și păstrează doar undo/redo nativ al textarea.
- `src/modules/diagram-editor/components/new-diagram/DialogFooter.tsx` (modificat): selectorul de engine.
- `src/modules/diagram-editor/hooks/useDiagram.ts` (modificat): autosave pentru `mermaidSource`.

## Pași
1. `npm i -D mermaid`. Verifică faptul că build-ul pune Mermaid într-un chunk separat.
2. `mermaid-loader.ts`, cu teste în care `mermaid` e mock-uit: debounce, erori cu număr de linie, id-uri unice.
3. `theme-variables.ts`, apoi re-randare la schimbarea `resolvedTheme`.
4. `templates.ts`.
5. `LineNumbers`, `MermaidSourcePane` (Tab inserează 2 spații; selecția de text e activă), `MermaidPreview`, `MermaidError`.
6. `useMermaidRender` și `MermaidEditor`.
7. Comutarea în `DiagramEditor` și ajustarea toolbar-ului.
8. Selectorul de engine în dialog.
   `createDiagram` primește `engine`; pentru `mermaid` scrie `mermaidSource` din șablon și lasă `data` gol.
9. Autosave pentru sursă. Status bar: „Mermaid · N lines”.
10. Teste:
    - sursa invalidă afișează eroarea și păstrează ultimul SVG valid;
    - schimbarea temei re-randează;
    - dialogul dezactivează „Text” pentru tipurile nesuportate.

## Criterii de acceptare
- O diagramă de secvență creată cu „Text” se editează cu previzualizare live în mai puțin de 300ms după oprirea tastării.
- Mermaid nu se încarcă deloc dacă utilizatorul nu deschide o diagramă Mermaid (verificare în tab-ul Network sau în log).
- Previzualizarea respectă tema curentă.

## Commit
`feat(diagram-editor): mermaid text diagrams with live preview`

## În afara scopului
Conversia Mermaid ↔ canvas, evidențierea sintaxei, autocompletarea.
