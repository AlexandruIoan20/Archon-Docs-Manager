# 10 — SQLite: index & metadata

## Scop
Un index local (`better-sqlite3`) al fișierelor din workspace: metadate, tag-uri, legături document ↔ diagramă, nodurile diagramelor și căutare full-text.
Fișierele de pe disc rămân sursa de adevăr. Indexul se poate reconstrui oricând.

## Referință design
Nu are UI propriu. Alimentează:
- căutarea globală (plan 20);
- căutarea din sidebar, pentru extindere viitoare pe titluri, nu doar pe nume;
- tag-urile din properties panel (plan 16), pentru sugestii.

## Dependențe
- Plan 09.
- npm: `better-sqlite3` (în `dependencies`) și `@types/better-sqlite3` (în `devDependencies`).
- Sistem: `build-essential` și `python3` pentru compilare.

## Decizii
- **Locație:** `userData/indexes/<workspaceId>.db`, nu în workspace. Workspace-ul rămâne curat pentru git, iar indexul e cache.
- **Build:**
  - `better-sqlite3` rămâne **externalizat** în main (nu intră în bundle);
  - `electron-builder.yml` → `asarUnpack: ['**/node_modules/better-sqlite3/**']`;
  - `postinstall` (existent) îl recompilează pentru ABI-ul Electron.
- **Teste:** modulul compilat pentru Electron nu se încarcă în Vitest pe Node.
  Testele de repository rulează cu Node-ul din Electron: script `test:main` = `ELECTRON_RUN_AS_NODE=1 electron ./node_modules/vitest/vitest.mjs run --config vitest.main.config.ts`.
- **Migrări:** fișiere TS numerotate, aplicate după `PRAGMA user_version`, fiecare într-o tranzacție.
- **Performanță:** `journal_mode = WAL`, `foreign_keys = ON`, statement-uri pregătite o singură dată per repository.

## Schema (migrarea 001)
```sql
files(id TEXT PRIMARY KEY, rel_path TEXT UNIQUE NOT NULL, kind TEXT NOT NULL,
      title TEXT NOT NULL, diagram_type TEXT, created TEXT, modified TEXT,
      mtime_ms INTEGER NOT NULL, size INTEGER NOT NULL)
file_tags(file_id TEXT REFERENCES files(id) ON DELETE CASCADE, tag TEXT, PRIMARY KEY(file_id, tag))
doc_links(doc_id TEXT REFERENCES files(id) ON DELETE CASCADE, diagram_id TEXT, PRIMARY KEY(doc_id, diagram_id))
diagram_nodes(file_id TEXT REFERENCES files(id) ON DELETE CASCADE, node_id TEXT, node_type TEXT,
              label TEXT, subtitle TEXT, description TEXT, PRIMARY KEY(file_id, node_id))
node_tags(file_id TEXT, node_id TEXT, tag TEXT, PRIMARY KEY(file_id, node_id, tag))
search_fts USING fts5(file_id UNINDEXED, node_id UNINDEXED, title, body, tokenize='unicode61 remove_diacritics 2')
projects(id TEXT PRIMARY KEY, name TEXT, root_path TEXT, last_opened TEXT)   -- în DB-ul global userData/app.db
```

## Fișiere
- `electron/modules/database/db.ts`: `openWorkspaceDb(workspaceId)`, `openAppDb()`, `closeAll()`, pragma-uri.
- `electron/modules/database/migrations/index.ts`: runner-ul de migrări.
- `electron/modules/database/migrations/001_initial.ts`
- `electron/modules/database/migrations/app/001_projects.ts`
- `electron/modules/database/repositories/documents.repo.ts`: `upsert(doc, stat)`, `remove(relPath)`, `getByPath`, `listByTag`.
- `electron/modules/database/repositories/diagrams.repo.ts`: `upsert(diagram, stat)` (inclusiv noduri și rândurile FTS), `remove`, `getByPath`.
- `electron/modules/database/repositories/projects.repo.ts`: `touch(workspace)`, `list()`.
- `electron/modules/database/repositories/search.repo.ts`: `query(text, limit)` → rezultate cu `snippet()` și `bm25`.
- `electron/modules/database/text-extract.ts`: text simplu din TipTap JSON, cu parcurgere recursivă.
- `electron/modules/database/indexer.ts`:
  - `fullSync(root)`: compară `mtime`/`size`, reindexează doar ce s-a schimbat și șterge ce lipsește;
  - `onFileChanged(rel)` / `onFileRemoved(rel)`, conectate la watcher;
  - rulează asincron, în loturi, ca să nu blocheze main-ul.
- `electron/modules/ipc/db.handler.ts`: `index:get-status`, `index:rebuild`, `index:list-tags`, `search:query` (folosit în plan 20).
- `vitest.main.config.ts`: `environment: 'node'`, `include: electron/**/*.test.ts`.
- `package.json` (modificat): script-ul `test:main`.
- `electron.vite.config.ts` (modificat): `better-sqlite3` explicit în `external`.
- `electron-builder.yml` (modificat): `asarUnpack`.

## Pași
1. `sudo apt install build-essential python3` (dacă lipsesc).
   `npm i better-sqlite3 && npm i -D @types/better-sqlite3`.
   Verifică faptul că `postinstall` a recompilat modulul pentru Electron: fișierul `.node` din `build/Release` are data curentă.
2. Configurează build-ul, `asarUnpack` și `external`. Rulează `npm run build:unpack` și pornește aplicația din `dist/`: modulul trebuie să se încarce.
3. `db.ts` și runner-ul de migrări. `vitest.main.config.ts` și `test:main`.
   Test: migrările rulează o singură dată, iar `user_version` crește.
4. `text-extract.ts` și test (titluri, liste, blocuri de cod).
5. Repository-urile, cu teste pe DB în memorie (`:memory:`).
6. `indexer.ts`:
   - teste pe director temporar: sync inițial, modificare, ștergere, fișier invalid (ignorat și logat);
   - un fișier invalid **nu** oprește sincronizarea.
7. Conectarea: `workspace.open` → `openWorkspaceDb` → `fullSync`; watcher → evenimente incrementale; scrierile din `fs.handler` → `upsert` direct.
8. `db.handler.ts` și contractul IPC.
9. Status: în timpul `fullSync`, status bar-ul afișează „Indexing…” (eveniment `index:progress` → `status.store`).
10. Ștergerea indexului la `closeWorkspace` nu e necesară. Pentru un index corupt se folosește `index:rebuild`.

## Criterii de acceptare
- Un workspace cu 1000 de fișiere se indexează fără ca UI-ul să înghețe.
- Redeschiderea unui workspace neschimbat nu reindexează nimic (verificare prin log).
- `search:query('isolate')` returnează nodul „Contain Host” (descriere „Isolates the endpoint via EDR”).
- Aplicația împachetată (`build:unpack`) pornește și folosește indexul.
- `npm run test:main` trece.

## Commit
`feat(database): sqlite workspace index with migrations and FTS search`

## În afara scopului
UI-ul de căutare (plan 20).
