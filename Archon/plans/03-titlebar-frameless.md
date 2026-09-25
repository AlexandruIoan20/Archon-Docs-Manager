# 03 — TitleBar & fereastră frameless

## Scop
Fereastra pierde rama nativă, iar bara de 48px din prototip devine bara de titlu a aplicației.
Trebuie să fie trasabilă (drag), să aibă controale de fereastră corecte pe fiecare OS și sloturi în care editorul activ își pune uneltele.

## Referință design
- Înălțime 48, fundal `--bg`, border-bottom 1px, `gap: 10px`, padding orizontal 12.
- **Brand:**
  - pătrat 24×24 r6, fundal accent, cu iconiță triunghi (path `M12 3 4 20h16L12 3Z` + `M8.6 14h6.8`), stroke `--on-accent` 2.2;
  - numele aplicației: 14px, 600, letter-spacing .2px, gap 9, padding-right 6.
- **Separatoare verticale:** 1×22 `--border`, între grupuri.
- **Ordinea grupurilor:** brand │ unelte editor │ controale de stil │ undo/redo │ *spațiu flexibil* │ Export │ theme toggle │ (avatar).
- **Theme toggle:** 30×30 r4, border, fundal surface2, iconiță moon/sun 15px text2.

### Densități (responsive)
Densitatea se calculează din lățimea disponibilă a barei, adică lățimea ei minus spațiul rezervat controalelor native.
Pragurile sunt în `TITLEBAR_DENSITY` (overview, „Strategie responsive”).

| Densitate | Lățime disponibilă | Ce se schimbă |
|---|---|---|
| `full` | ≥ 1000 | ca în prototip |
| `compact` | 700–999 | controalele de stil ale editorului intră într-un singur buton „Style” cu popover (plan 15) |
| `minimal` | < 700 | brand doar cu pătratul (numele apare în tooltip); uneltele secundare intră în meniul „⋯” (plan 15); Export devine `IconButton` (plan 19); `gap` 6, padding 8 |

- Grupurile nu se înfășoară pe două rânduri. Ca plasă de siguranță, grupul de unelte are `min-width: 0` și `overflow: hidden`, deci nimic nu iese din bară.
- Între densități există un histerezis de 24px, ca bara să nu oscileze când lățimea stă chiar pe prag.

## Dependențe
- Plan 02.
- Fără pachete npm noi.

## Decizii
- **Dimensiunea ferestrei:** minimum 720×480.
  Dimensiunea inițială este `min(1440×900, 90% din workArea)` a ecranului pe care apare cursorul, iar fereastra se centrează.
  Dacă workArea e mai mică decât minimul (ecrane foarte mici), minimul coboară la dimensiunea workArea, ca fereastra să nu iasă din ecran.
- **Windows:** `titleBarStyle: 'hidden'` + `titleBarOverlay` (butoane native, Snap Layouts funcționează).
  Culorile overlay-ului se actualizează la schimbarea temei (plan 05).
- **macOS:** `titleBarStyle: 'hiddenInset'` + `trafficLightPosition: { x: 14, y: 16 }`, centrate vertical în 48px.
  Bara rezervă 78px în stânga.
- **Linux:** `frame: false` + componenta proprie `WindowControls`, deoarece comportamentul `titleBarOverlay` diferă între window manager-e.
- Butoanele din bară primesc `-webkit-app-region: no-drag`, iar bara `drag`.
  Pe Linux, dublu-click pe zona de drag comută maximize.

## Fișiere
- `src/core/types/ipc.types.ts` (modificat):
  - canale noi: `window:minimize`, `window:toggle-maximize`, `window:close`, `window:is-maximized`, `window:set-titlebar-colors`;
  - contract nou `IpcEventContract` pentru evenimente main → renderer: `window:maximized-changed`;
  - `ArchonApi.window` și `ArchonApi.on`.
- `electron/modules/ipc/typed-ipc.ts` (modificat): helper `send<E>(window, event, payload)` tipat pe `IpcEventContract`.
- `electron/modules/ipc/window.handler.ts`: handlerele de fereastră. Fereastra se ia din `BrowserWindow.fromWebContents(event.sender)`.
- `electron/modules/window-manager.ts` (modificat): opțiunile de ramă per platformă și emiterea `maximized-changed` pe evenimentele `maximize`/`unmaximize`.
- `electron/preload.ts` (modificat):
  - `window.*`;
  - `on(event, cb)`, care returnează funcția de dezabonare. Callback-ul primește doar payload-ul, nu `IpcRendererEvent`.
- `src/core/ipc/ipc-client.ts` (modificat): `ipcClient.window`, `ipcClient.on`.
- `src/core/constants/app.constants.ts` (modificat): `APP_NAME`, conform deciziei deschise din overview.
- `electron/modules/window-bounds.ts`: funcție pură `resolveInitialBounds(workArea, preferred, min)` → `{ x, y, width, height, minWidth, minHeight }`. Plan 05 o extinde cu bounds-urile salvate.
- `src/core/constants/layout.constants.ts` (modificat): `TITLEBAR_DENSITY = { full: 1000, compact: 700, hysteresis: 24 }`, `TitleBarDensity` ca union.
- `src/shared/components/layout/title-bar/title-bar-density.ts`: funcție pură `resolveTitleBarDensity(availableWidth, previous)`.
- `src/shared/components/layout/title-bar/TitleBarDensityContext.tsx`: context și hook-ul `useTitleBarDensity()`, folosit de contribuțiile editoarelor.
- `src/shared/hooks/usePlatform.ts`: platforma din `app:get-info`, prin React Query cu `staleTime: Infinity`.
- `src/shared/components/layout/TitleBar.tsx`: layout-ul și sloturile (`toolbar`, `actions`).
- `src/shared/components/layout/title-bar/BrandMark.tsx`: prop `compact` (ascunde numele și îl pune în tooltip).
- `src/shared/components/layout/title-bar/WindowControls.tsx`: doar pe Linux; minimize / maximize-restore / close, 46×48, hover pe close roșu `--danger`.
- `src/shared/components/layout/title-bar/ThemeToggleButton.tsx`: doar UI (primește `theme` și `onToggle` prin props; legătura în plan 05).

## Pași
1. Extinde contractul IPC cu canalele de fereastră și cu `IpcEventContract`.
   Actualizează `ArchonApi` și rulează typecheck-ul.
   Toate trei straturile trebuie să eșueze la compilare până sunt implementate.
2. Implementează `window.handler.ts` și înregistrează-l în `ipc/index.ts`.
3. Adaugă `send()` în `typed-ipc.ts`. În `window-manager.ts`, emite `window:maximized-changed`.
4. În preload, expune `window.*` și `on()`.
   `on()` acceptă doar chei din `IpcEventContract`, iar lista e verificată la runtime cu un `Set`.
5. Actualizează `ipc-client.ts`.
6. `window-bounds.ts` cu teste (ecran 1280×680 → fereastră 1152×612; ecran 700×450 → minimul coboară, iar fereastra ocupă 700×450 întreg).
   Regula: `width = clamp(min(preferred, 90% × workArea), min(minWidth, workArea), workArea)`, la fel pentru înălțime.
   `window-manager.ts` folosește `screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea`, iar `MAIN_WINDOW_DEFAULTS` devine `{ width: 1440, height: 900, minWidth: 720, minHeight: 480 }`.
   Configurează rama per platformă în `window-manager.ts`.
   Pe Windows, `titleBarOverlay: { color: '#0D0F16', symbolColor: '#8892A4', height: 48 }`.
7. `usePlatform()`.
8. `BrandMark`, `WindowControls` (starea de maximizare se ascultă prin `ipcClient.on`), `ThemeToggleButton`.
9. `TitleBar`, cu props `toolbar?: ReactNode` și `actions?: ReactNode`.
   Rezervă spațiu stânga pe macOS (78px) și dreapta pe Windows (lățimea overlay-ului, ~138px), cu `env(titlebar-area-*)` unde e disponibil.
   Separatoarele apar doar între grupuri care au conținut.
   `TitleBar` măsoară lățimea disponibilă cu `useElementSize`, calculează densitatea și o oferă prin `TitleBarDensityContext`.
   Controalele native nu se măsoară: spațiul lor e rezervat prin padding, deci lățimea măsurată e deja cea disponibilă.
10. În `App.tsx` provizoriu, randează `TitleBar` sus. În slotul `toolbar`, un placeholder gol.
11. Teste:
    - `TitleBar` randează sloturile și ascunde separatoarele goale;
    - `resolveTitleBarDensity`: praguri și histerezis (999 → `compact`, apoi 1010 rămâne `compact`, 1024 → `full`);
    - `BrandMark` în `minimal` ascunde numele;
    - `WindowControls` apelează `ipcClient.window.*` (mock pe `window.archon`).

## Criterii de acceptare
- Fereastra se mută trăgând de bară și se maximizează/restaurează/închide corect pe Linux.
- Pe Windows și macOS, controalele native apar la locul lor (verificare la primul build pe acele platforme).
- Niciun element interactiv din bară nu declanșează drag.
- Un canal IPC inexistent sau un payload greșit nu compilează.
- Fereastra nu poate fi micșorată sub 720×480, iar pe un ecran 1366×768 la 125% se deschide complet vizibilă.
- La 720px lățime, bara nu taie niciun element și nu se înfășoară, pe toate cele trei platforme (inclusiv cu overlay-ul de pe Windows).

## Commit
`feat(titlebar): frameless window with platform-aware title bar`

## În afara scopului
- Uneltele de diagramă (plan 15), Export (plan 19).
- Logica temei (plan 05).
- Avatarul (decizie deschisă).
