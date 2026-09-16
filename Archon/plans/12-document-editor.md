# 12 — Document editor (TipTap)

## Scop
Editorul pentru `.soardoc`: text formatat cu TipTap, layout-ul vizual al documentului din prototip, bara de formatare în TitleBar, autosave cu debounce și contribuțiile în status bar și inspector.

## Referință design (view-ul „doc” din prototip)
- **Container:** flex-1, fundal `--canvas`, `overflow-y: auto`, padding 40px 0.
- **Coloană:** `max-width: 640px`, centrată.
  - Cale: mono 11px text3, mb10 (ex. `Runbooks/ir-policy.soardoc`).
  - Titlu: 26px, 700, letter-spacing -.3px, mb16.
  - Corp: Inter 14px, line-height 1.75, culoare text2, fără border, fundal transparent, `min-height: 420px`.
- **Status bar:** „N words”.
- **Tab dirty:** punctul accent (prototipul îl arată pe documentul `ir-policy.md`).

## Dependențe
- Plan 11.
- npm (bundled în renderer, deci `-D`):
  - `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`;
  - `@tiptap/extension-placeholder`, `@tiptap/extension-link`, `@tiptap/extension-typography`.

## Fișiere
- `src/modules/document-editor/hooks/useDocumentFile.ts`: `useQuery(fs:read-document)` și `useMutation(fs:write-document)`.
- `src/modules/document-editor/hooks/useAutosave.ts`:
  - debounce 800ms (prin `shared/hooks/useDebounce.ts`);
  - `setDirty(true)` la modificare și `false` după salvarea reușită;
  - `Ctrl/Cmd+S` salvează imediat;
  - înregistrează handler-ul de save pentru garda din plan 11.
- `src/shared/hooks/useDebounce.ts`: `useDebouncedCallback(fn, ms)` cu `flush` și `cancel`.
- `src/modules/document-editor/hooks/useDocumentEditor.ts`: configurează `useEditor` (extensii, `editorProps`, `onUpdate`).
- `src/modules/document-editor/components/extensions/index.ts`: lista de extensii, configurată o singură dată.
- `src/modules/document-editor/components/DocumentEditor.tsx`: layout-ul coloanei (cale, titlu editabil, `EditorContent`).
- `src/modules/document-editor/components/DocumentTitle.tsx`:
  - input stilizat ca titlu 26px;
  - Enter mută focusul în corp;
  - schimbarea titlului actualizează `title` din fișier (nu redenumește fișierul).
- `src/modules/document-editor/components/Toolbar.tsx`: contribuția `Toolbar` pentru TitleBar.
  - Grupuri separate de `Divider`: B / I / cod inline │ H1 / H2 / H3 │ listă cu puncte / listă numerotată / citat │ bloc de cod.
  - Undo / redo cu stilul din prototip: culoare text dacă e disponibil, altfel text3.
  - Butoanele sunt `IconButton` 30×30 cu `active` după `editor.isActive(...)`.
- `src/modules/document-editor/components/DocumentInspector.tsx`: contribuția `Inspector`: TAGS (`TagInput`) și LINKED DIAGRAMS (listă; adăugarea se face prin căutare în plan 20).
- `src/modules/document-editor/components/DocumentStatusItems.tsx`: „N words”.
- `src/modules/document-editor/utils/word-count.ts`
- `src/modules/document-editor/styles/prose.css`: tipografia conținutului TipTap, doar din tokenuri.
  - `h1` 22 / `h2` 18 / `h3` 15, culoare text;
  - `code` mono pe surface2;
  - `pre` r6 border;
  - `blockquote` cu border-left accent;
  - link-uri accent;
  - placeholder text3.
- `src/modules/document-editor/index.ts`: exportă `documentEditorContribution: EditorContribution`.
- `src/shared/components/icons/icon-paths.ts` (modificat): iconițele bold, italic, code, heading1–3, list, listOrdered, quote, codeBlock (stil Lucide, stroke 1.5).
- `src/App.tsx` (modificat): înregistrează contribuția.

## Pași
1. Instalează pachetele TipTap și verifică compatibilitatea cu React 19.
2. `useDebounce` și testele lui (fake timers, `flush`, `cancel` la unmount).
3. `word-count.ts` și test (spații multiple, text gol → 0, diacritice).
4. `extensions/index.ts`: StarterKit (heading 1–3), Placeholder („Start writing…”, textul din prototip), Link (`openOnClick: false`; deschiderea externă o face main-ul), Typography.
5. `useDocumentFile`, `useDocumentEditor`, `useAutosave`.
   **Regulă:** conținutul editorului **nu** se ține în Zustand. TipTap e sursa de adevăr în timpul editării, iar React Query ține versiunea salvată.
6. `DocumentTitle` și `DocumentEditor`, cu stilurile din prototip. Selecția de text e reactivată pe container (`user-select: text`).
7. `prose.css`, importat în `DocumentEditor.tsx`.
8. `Toolbar` (contribuție).
   Primește `tab` prin props. Instanța editorului se accesează dintr-un context local modulului (`DocumentEditorContext`, keyed pe `tabId`), fiindcă Toolbar și Editor sunt randate în sloturi diferite.
9. `DocumentStatusItems` și `DocumentInspector`.
10. **Reîncărcare externă:**
    - dacă fișierul se schimbă pe disc și tab-ul nu e `dirty`, conținutul se reîncarcă păstrând poziția cursorului, pe cât posibil;
    - dacă tab-ul e `dirty`, apare un toast de conflict cu acțiunea „Reload”.
11. `documentEditorContribution` și înregistrarea în `App.tsx`.
12. Teste:
    - încărcare → editare → autosave apelează mutația după 800ms;
    - `Ctrl+S` salvează imediat;
    - butonul Bold comută marcajul;
    - numărul de cuvinte se actualizează.

## Criterii de acceptare
- Documentul arată ca view-ul din prototip, în ambele teme.
- Editarea marchează tab-ul `dirty`, iar după ~800ms salvează și marcajul dispare.
- Toate formatările din bara de unelte funcționează și sunt salvate ca TipTap JSON valid (schema din plan 09).
- Nicio pierdere de date la închiderea rapidă a tab-ului imediat după tastare: `flush` rulează la unmount.

## Commit
`feat(document-editor): tiptap editor with toolbar and autosave`

## În afara scopului
- Imagini și tabele în documente.
- Embed de diagrame în document (extensie TipTap custom, plan viitor).
- Export de documente.
