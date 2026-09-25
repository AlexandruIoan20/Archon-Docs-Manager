# 07 — Workspace în procesul main

## Scop
Crearea și deschiderea unui workspace (`.arws`) și citirea arborelui de fișiere.
Include urmărirea schimbărilor de pe disc și ecranul afișat când nu e deschis niciun workspace.
Tot accesul la disc stă în main, iar renderer-ul vede doar căi **relative** la workspace.

## Referință design
- Header-ul sidebar-ului afișează numele workspace-ului („SecOps Core”) și un badge cu inițiala. UI-ul complet e în plan 08.
- Designul nu are ecran fără workspace. Folosim stilul din dialogul „New diagram”:
  - fundal `--canvas`;
  - card centrat `width: min(480px, 100% - 32px)`, r8, border;
  - ecranul are `overflow-y: auto` și `padding: 24px 16px`, iar cardul se centrează cu `margin: auto`, ca la 480px înălțime să nu fie tăiat sus;
  - butoane primary („Create workspace”) și secondary („Open workspace…”);
  - listă „Recent” cu căi mono 11px text3, trunchiate la mijloc cu `truncateMiddle` și tooltip cu calea completă;
  - sub 400px lățime de card (container query), butoanele se pun unul sub altul, pe toată lățimea.

## Dependențe
- Plan 06.
- npm: `chokidar` 5 (în `dependencies`, fiindcă rulează în main) și `zod` (în `dependencies`).

## Decizii
- **Layout pe disc:**
  ```
  <root>/workspace.arws
  <root>/**/<nume>.ardoc
  <root>/**/<nume>.ardiag
  ```
  Alte fișiere și folderele care încep cu `.` sunt ignorate în tree.
- **`.arws` primește câmpul `id` (UUID).** Indexul SQLite (plan 10) se leagă de el, nu de cale, ca să supraviețuiască mutării folderului.
- **Securitatea căilor:** orice cale venită din renderer trece prin `resolveInWorkspace(rel)`.
  Funcția normalizează calea, respinge căile absolute și `..` și verifică `realpath` în interiorul root-ului (protecție la symlink).
  Singurul modul care atinge `fs` direct este `electron/modules/file-system/`.
- **chokidar 5 este ESM-only.** Main-ul e compilat CJS, așa că `chokidar` se **exclude din externalizare** (`build.externalizeDeps.exclude: ['chokidar']` în `electron.vite.config.ts`) și ajunge în bundle.
  Se verifică în `out/main/index.js` după build.

## Fișiere
- `src/core/schemas/workspace.schema.ts`: `zod` pentru `.arws`: `version`, `id`, `name`, `created`, `lastModified`, `settings { theme: 'inherit' | 'dark' | 'light', defaultDiagramType }`.
- `src/core/types/workspace.types.ts`:
  - `WorkspaceInfo { id, name, rootName }` (fără cale absolută către renderer, cu excepția listei de recente);
  - `TreeEntry = FolderEntry | FileEntry`, cu `relPath`, `name`, `kind`, `children`.
- `formats/arws.schema.json`: JSON Schema echivalentă, ca documentație pentru format.
- `electron/modules/file-system/paths.ts`: `resolveInWorkspace`, `toRelPath`, `isHidden`.
- `electron/modules/file-system/workspace.ts`: `createWorkspace(dir, name)`, `openWorkspace(pathToArwsOrDir)`, `getCurrent()`, `closeWorkspace()`.
- `electron/modules/file-system/reader.ts`: `readTree(root)` (recursiv, sortat: foldere întâi, apoi alfabetic, case-insensitive), `readJson(rel, schema)`.
- `electron/modules/file-system/writer.ts`: `writeJsonAtomic(rel, data)`, `ensureDir`.
- `electron/modules/file-system/watcher.ts`:
  - chokidar pe root, cu `ignoreInitial` și `awaitWriteFinish`;
  - emite `workspace:tree-changed` cu debounce de 150ms;
  - ignoră scrierile proprii prin marcaje temporare.
- `electron/modules/ipc/workspace.handler.ts`:
  - `workspace:create` (deschide `dialog.showOpenDialog` pentru folder + primește numele);
  - `workspace:open-dialog`, `workspace:open-recent(path)`, `workspace:close`;
  - `workspace:get-current`, `workspace:read-tree`, `workspace:reveal(rel)` (`shell.showItemInFolder`).
- `electron/modules/settings/settings.ts` (modificat): `recentWorkspaces`, maximum 8, fără duplicate, cele inexistente curățate la citire.
- `src/store/workspace.store.ts`: `current: WorkspaceInfo | null` și `setCurrent`. Arborele în sine stă în React Query (vezi plan 08).
- `src/modules/workspace/hooks/useWorkspace.ts`: query-uri și mutații; invalidează `['workspace','tree']` la evenimentul `tree-changed`.
- `src/modules/workspace/components/WorkspaceLanding.tsx`: ecranul fără workspace.
- `src/modules/workspace/index.ts`: exportă `WorkspaceLanding` și `useWorkspace`.
- `src/App.tsx` (modificat): dacă `current` e null, randează `WorkspaceLanding` în locul corpului shell-ului. TitleBar și status bar rămân.

## Pași
1. `npm i chokidar zod`. Configurează excluderea chokidar din externalizare și verifică build-ul.
2. `workspace.schema.ts` și tipurile derivate. `formats/arws.schema.json`.
3. `paths.ts`, cu teste pentru: `..`, absolut, symlink ieșit din root, căi Windows (`\`).
4. `reader.ts` și `writer.ts`, cu teste pe director temporar: sortare, ignorarea fișierelor ascunse și străine, scriere atomică.
5. `workspace.ts`:
   - `create` refuză un folder care conține deja `workspace.arws`;
   - `open` acceptă fie fișierul, fie folderul;
   - un `.arws` invalid produce o eroare tipată `WorkspaceError { code: 'INVALID_FILE' | 'NOT_FOUND' | 'ALREADY_EXISTS' }`, serializată prin IPC.
6. **Convenția de erori IPC:** handler-ele returnează `Result<T> = { ok: true, value } | { ok: false, error: { code, message } }`, în loc să arunce.
   Se definește acum în `ipc.types.ts` și devine standard pentru toate canalele noi.
   `ipc-client.ts` desface rezultatul și aruncă `IpcError` tipat, ca React Query să-l trateze.
7. `watcher.ts`: pornit la `open`, oprit la `close`/`quit`.
8. `workspace.handler.ts`, plus evenimentul `workspace:tree-changed` în `IpcEventContract`.
9. Aplicarea `settings.theme` din `.arws` peste setarea aplicației, dacă nu e `inherit` (decizie din plan 05).
10. `workspace.store`, `useWorkspace`, `WorkspaceLanding`.
11. **Redeschidere automată:** la pornire, se redeschide ultimul workspace dacă mai există.
12. Teste renderer: `WorkspaceLanding` apelează create/open, iar lista de recente e randată.

## Criterii de acceptare
- Poți crea un workspace nou, închide aplicația și, la repornire, workspace-ul se redeschide.
- Un fișier creat sau șters din file manager apare sau dispare din datele tree-ului în ~200ms.
- O cerere IPC cu `../../etc/passwd` este respinsă cu `code: 'PATH_OUTSIDE_WORKSPACE'`.
- `out/main/index.js` nu conține `require("chokidar")`.

## Commit
`feat(workspace): create/open workspaces, tree reading and file watching`

## În afara scopului
UI-ul tree-ului (plan 08), crearea de fișiere (plan 09).
