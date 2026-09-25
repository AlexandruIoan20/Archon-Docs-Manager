# 09 — CRUD fișiere & formate

## Scop
Formatele `.ardoc` și `.ardiag` complete (cu câmpurile cerute de design), scheme de validare și operațiile de creare, citire, scriere, redenumire, mutare și ștergere.
Operațiile se leagă de butonul „New” și de arbore.

## Referință design
- **„New document”:**
  - creează `untitled-N` în folderul-țintă, expandează folderul, deschide tab-ul;
  - toast „Document created in <path>/”.
- **„New folder”:**
  - creează `new-folder-N` în folderul-țintă, îl expandează și **îl face noul folder-țintă**;
  - toast „Folder created”.
- **„New diagram…”:** deschide modalul `new-diagram` (plan 17).
  Până atunci, un fallback temporar creează direct o diagramă `flowchart` goală.
- **Datele unui nod în prototip:** `id`, `label`, `sub`, `color`, `icon`, `x`, `y`, `shape` (`rect` | `diamond`), `desc`, `tags[]`, `retry`.
- **Datele unei muchii:** `from`, `to`, `label?`.
- **Diagrama:** `type` (id UML sau flowchart).

## Dependențe
- Plan 08.
- Fără pachete npm noi (`zod` e deja instalat).

## Formate (versiunea 1.0.0)

**`.ardoc`**
```jsonc
{
  "version": "1.0.0", "id": "uuid", "title": "Incident Response Policy",
  "created": "ISO", "lastModified": "ISO",
  "content": { "type": "doc", "content": [] },   // TipTap JSON ca obiect, nu string
  "tags": [], "linkedDiagrams": []
}
```

**`.ardiag`**
```jsonc
{
  "version": "1.0.0", "id": "uuid", "title": "Phishing triage",
  "type": "activity",                 // DiagramType = 'flowchart' | 14 tipuri UML (plan 17)
  "engine": "react-flow",             // | "mermaid" (plan 18)
  "created": "ISO", "lastModified": "ISO",
  "style": { "nodeStyle": null, "edgeStyle": null },   // null = preferința aplicației
  "data": {
    "nodes": [{
      "id": "N1", "type": "trigger",  // trigger | action | decision | integration | element | shape-rect | shape-ellipse | text
      "position": { "x": 40, "y": 250 },
      "data": { "label": "", "subtitle": "", "color": "#7C3AED", "icon": "zap",
                "description": "", "tags": [], "retryOnFail": false,
                "stroke": null, "fill": null, "strokeWidth": null, "fontSize": null }
    }],
    "edges": [{ "id": "e-N1-N2", "source": "N1", "target": "N2", "label": null }],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  },
  "mermaidSource": null,
  "exportedAt": null,
  "tags": []
}
```

- Structura nodurilor și a muchiilor e compatibilă direct cu React Flow (`id` / `type` / `position` / `data`), deci nu e nevoie de conversie.
- Id-urile de nod sunt scurte (`N1`, `N2`…), ca în prototip, pentru că apar în UI (badge, status bar). Unicitatea e garantată per diagramă.

## Fișiere
- `src/core/schemas/document.schema.ts` și `src/core/schemas/diagram.schema.ts`: `zod`, cu `.default()` pentru câmpurile opționale.
- `src/core/types/document.types.ts`, `diagram.types.ts`: `z.infer`, plus `DiagramType`, `DiagramNodeType`, `DiagramEngine`.
- `src/core/types/index.ts` (modificat)
- `src/core/constants/file-extensions.ts`: `FILE_EXTENSIONS = { workspace: '.arws', document: '.ardoc', diagram: '.ardiag' } as const`, plus `fileKindFromPath()`.
- `formats/ardoc.schema.json`, `formats/ardiag.schema.json`
- `electron/modules/file-system/naming.ts`:
  - `slugify(title)`;
  - `nextAvailableName(dir, base, ext)` (`untitled-1`, `untitled-2`…; numerotarea continuă după cel mai mare număr existent);
  - `validateFileName` (fără caractere interzise pe Windows și fără nume rezervate `CON`, `NUL`…).
- `electron/modules/file-system/documents.ts`: `createDocument(folderRel, title?)`, `readDocument(rel)`, `writeDocument(rel, doc)`.
- `electron/modules/file-system/diagrams.ts`: `createDiagram(folderRel, { type, title?, engine, nodes?, edges? })`, `readDiagram`, `writeDiagram`.
- `electron/modules/file-system/entries.ts`: `createFolder`, `renameEntry`, `moveEntry`, `deleteEntry` (prin `shell.trashItem`, nu ștergere definitivă).
- `electron/modules/ipc/fs.handler.ts`: toate canalele `fs:*` de mai sus, fiecare cu rezultat `Result<T>`.
- `src/modules/workspace/hooks/useFileActions.ts`:
  - mutații pentru create/rename/move/delete;
  - la succes: invalidează tree-ul, setează expandarea și ținta, deschide tab-ul prin `editor.store` și notifică prin `ui.store`.
- `src/modules/workspace/components/InlineRename.tsx`: input în rând (F2 / dublu-click); Enter confirmă, Escape anulează, focusul se pierde = confirmă.
- `src/modules/workspace/components/ConfirmDeleteModal.tsx`: înregistrat ca `ModalId` `'confirm-delete'`.

## Pași
1. Schemele `zod`, tipurile derivate și schemele JSON.
   Test: exemplele din acest plan (și din specificație) trec validarea; un nod fără `id` e respins.
2. `file-extensions.ts` și test.
3. `naming.ts` și teste: coliziuni, caractere invalide, nume rezervate.
4. `documents.ts` și `diagrams.ts`:
   - la creare setează `id` (`crypto.randomUUID()`), `created` și `lastModified`;
   - la scriere actualizează `lastModified` și validează **înainte** de a scrie;
   - citirea unui fișier invalid returnează `code: 'INVALID_FILE'` cu detaliile din zod.

   Teste pe director temporar.
5. `entries.ts`:
   - `rename` păstrează extensia;
   - `move` refuză mutarea unui folder în el însuși.

   Teste.
6. `fs.handler.ts` și extinderea contractului IPC.
   Scrierile proprii se marchează în watcher (plan 07), ca să nu declanșeze reîncărcări inutile.
7. `useFileActions`.
8. Leagă `NewMenu`:
   - „New document” / „New folder” → mutații;
   - „New diagram…” → fallback temporar (comentariu `TODO(plan-17)`).
9. `InlineRename`, apoi activarea lui automată după „New folder”, ca în exploratoarele de fișiere.
10. Ștergere: tasta Delete pe rândul focusat din arbore → `ConfirmDeleteModal` → `trashItem`.
    Tab-urile deschise ale fișierului șters se închid în plan 11.
11. Opțional: drag & drop în arbore pentru mutare (HTML5 DnD, pe rândurile de folder).
12. Teste de componente: fluxul „New folder” (creare → rename inline → noua țintă) și fluxul de ștergere.

## Criterii de acceptare
- Fișierele create se deschid în orice editor de text și validează cu `formats/*.schema.json`.
- Crearea repetată produce `untitled-1`, `untitled-2`… fără suprascrieri.
- Redenumirea cu nume invalid afișează eroarea inline și nu atinge discul.
- Ștergerea trimite fișierul în coșul sistemului.
- Toast-urile corespund textelor din prototip.

## Commit
`feat(file-system): ardoc/ardiag formats and file CRUD`

## În afara scopului
Indexarea (plan 10), editarea conținutului (planurile 12 și 13).
