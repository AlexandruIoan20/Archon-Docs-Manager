# 19 — Export PNG / SVG / PDF / XMI

## Scop
Butonul „Export” din TitleBar, cu dropdown-ul din prototip, pentru diagrama activă (canvas sau Mermaid).
Fișierul se salvează prin dialogul nativ al sistemului.

## Referință design
- **Butonul „Export”:** h30, padding 0 12, r4, border `--accent-border`, fundal transparent, text accent 12px 500, iconiță download 14, gap 7.
  E așezat înaintea toggle-ului de temă.
- **Dropdown:** absolut sub buton (`top: 44`), 190px, r8, surface, border, shadow-menu, p5, z-index 40.
  - Opțiuni h28 12px: „PNG”, „SVG”, „PDF”, „UML XMI”.
  - Extensia apare în dreapta (mono 10 text3): `.png`, `.svg`, `.pdf`, `.xmi`.
- **Toast:** „Exporting <file> as <FORMAT>”, urmat, în versiunea noastră, de „Exported to <path>” sau de o eroare.

## Dependențe
- Plan 17.
- Plan 18 e opțional: dacă nu e gata, pasul 4 (export Mermaid) se amână, iar 18 și 19 pot rula în paralel.
- npm: `html-to-image` (bundled, `-D`).

## Decizii
- **PNG / SVG (canvas):**
  - `html-to-image` pe `.react-flow__viewport`, cu limitele calculate prin `getNodesBounds` și `getViewportForBounds` (padding 24);
  - fundalul se rezolvă din `--canvas` la momentul exportului;
  - PNG la `pixelRatio: 2`;
  - handle-urile, chrome-ul de selecție, minimap-ul și controalele se exclud (`filter` pe clase).
- **PNG / SVG (Mermaid):** SVG-ul randat direct. PNG prin desenarea SVG-ului într-un `<canvas>`.
- **PDF:** main-ul creează o fereastră ascunsă (`show: false`, `sandbox`, fără preload), încarcă SVG-ul exportat printr-un `data:` URL, apelează `webContents.printToPDF` cu pagina dimensionată după SVG, apoi închide fereastra.
- **UML XMI 2.5.1:** serializator propriu pentru `class`, `activity` și `state`. Pentru celelalte tipuri, opțiunea e dezactivată, cu tooltip „Not available for this diagram type”.
  Pasul e opțional (decizie deschisă în overview).
- **Scriere:** renderer-ul trimite `Uint8Array` sau string prin IPC `export:save`.
  Main-ul afișează `dialog.showSaveDialog`, cu nume implicit `<title>.<ext>` și folderul ultimului export (reținut în setări), apoi scrie fișierul.
  Renderer-ul nu alege niciodată calea direct.
- **`exportedAt`** din `.soardiag` se actualizează după un export reușit.

## Fișiere
- `src/core/types/ipc.types.ts` (modificat): `export:save` (`{ defaultName, extension, data }` → `Result<{ path } | { canceled: true }>`) și `export:pdf-from-svg`.
- `electron/modules/export/save-file.ts`
- `electron/modules/export/svg-to-pdf.ts`
- `electron/modules/ipc/export.handler.ts`
- `src/modules/diagram-editor/export/export-canvas.ts`: `toPng`, `toSvg` pentru React Flow.
- `src/modules/diagram-editor/export/export-mermaid.ts`
- `src/modules/diagram-editor/export/xmi/serialize-xmi.ts`: dispecer după tipul diagramei.
- `src/modules/diagram-editor/export/xmi/class.xmi.ts`, `activity.xmi.ts`, `state.xmi.ts`
- `src/modules/diagram-editor/export/export-formats.ts`: `EXPORT_FORMATS` (label, extensie, `isAvailable(diagram)`).
- `src/modules/diagram-editor/hooks/useExportDiagram.ts`: orchestrare, toast-uri, `exportedAt`.
- `src/modules/diagram-editor/components/toolbar/ExportMenu.tsx`: contribuția `TitleActions` (`Button outline-accent` + `Menu`).
- `src/modules/diagram-editor/index.ts` (modificat): `TitleActions: ExportMenu`.

## Pași
1. `npm i -D html-to-image`.
2. Canalele IPC, `save-file.ts` și `export.handler.ts`.
   Test pentru `save-file` cu mock pe `dialog`: anularea returnează `canceled`.
3. `export-canvas.ts`.
   Verificare manuală: PNG-ul conține doar diagrama, fără UI, în tema curentă.
4. `export-mermaid.ts`.
5. `svg-to-pdf.ts`.
   Verificare manuală: PDF-ul are o singură pagină, dimensionată după diagramă, cu text vectorial.
6. `export-formats.ts` și `ExportMenu`, cu opțiunile indisponibile dezactivate.
7. `useExportDiagram`: toast la început, la succes și la eroare; actualizează `exportedAt` (fără să marcheze tab-ul `dirty` inutil: scrierea e directă).
8. **XMI (opțional):** `serialize-xmi.ts` și cele trei mapări.
   Teste de tip snapshot pe diagramele exemplu. Validarea structurii se face importând fișierul într-un tool UML (manual).
9. Teste:
   - meniul listează cele 4 formate cu extensiile lor;
   - XMI e dezactivat pentru `sequence`;
   - anularea dialogului nu afișează toast de succes.

## Criterii de acceptare
- PNG, SVG și PDF se exportă corect pentru diagramele canvas și Mermaid, în ambele teme.
- Exportul nu modifică viewport-ul sau selecția utilizatorului.
- Nicio cale de fișier nu e aleasă de renderer.

## Commit
`feat(export): png, svg, pdf and uml xmi export for diagrams`

## În afara scopului
Export de documente (Markdown / PDF), export în lot al workspace-ului.
