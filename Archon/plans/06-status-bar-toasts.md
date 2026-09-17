# 06 — Status bar & notificări (toast)

## Scop
Infrastructura de feedback din prototip: status bar-ul cu segmente și toast-ul temporar, folosite de toate acțiunile ulterioare.

## Referință design
**Status bar**
- Înălțime 24, fundal `--side`, border-top, padding 0 12, gap 14, 11px text2.
- În stânga:
  - punct 6px + text de stare: „Ready” (`--success`) sau „Connecting…” în timpul uneltei connect;
  - calea fișierului activ (mono), sau „No file open”.
- În dreapta (`margin-left: auto`):
  - contoare: „6 nodes · 5 edges” sau „74 words” (mono);
  - „Selection: N2” sau „—”;
  - eticheta temei `DARK`/`LIGHT` (mono);
  - zoom „87%” (mono).
- **Responsive** (container query pe status bar):
  - fiecare segment are o prioritate; sub 720px dispare eticheta temei, sub 560px selecția, sub 420px contoarele;
  - starea, calea și zoom-ul rămân mereu;
  - calea ocupă spațiul rămas (`flex: 1 1 auto`, `min-width: 0`), e trunchiată la mijloc cu `truncateMiddle` și are tooltip cu calea completă;
  - segmentele nu se înfășoară (`white-space: nowrap`).

**Toast**
- Centrat orizontal, `bottom: 44px`, h32, padding 0 14, r6, fundal surface, border `--accent-border`, 12px, shadow-toast, z-index 60.
- Punct accent de 6px în stânga.
- Dispare după **1900ms**. Un toast nou îl înlocuiește pe cel curent și resetează timer-ul.
- **Responsive:** `max-width: min(560px, 100vw - 32px)`, un singur rând cu ellipsis și textul complet în `title`.
  Toast-urile de eroare pot avea două rânduri (`-webkit-line-clamp: 2`).
- Mesaje folosite în prototip:
  - „Node deleted — ⌘Z to undo”, „Node added”, „Edge created”;
  - „Folder created”, „Document created in X/”, „<Type> diagram created in X/”;
  - „Exporting … as PNG”, „Nothing to undo”, „Nothing to redo”.

## Dependențe
- Plan 05.

## Fișiere
- `src/store/ui.store.ts` (modificat), secțiunea `notifications`:
  - `toast: { id: number; message: string; tone: 'info' | 'error' } | null`;
  - `notify(message, tone?)`, `dismissToast()`.

  Dacă fișierul trece de 200 de linii, se sparge în `src/store/ui/` pe slice-uri (`layout.slice.ts`, `modal.slice.ts`, `notification.slice.ts`), cu `ui.store.ts` ca agregator.
- `src/store/status.store.ts`:
  - `statusText` (implicit „Ready”) și `setStatus`;
  - segmentele globale sunt calculate din alte store-uri; segmentele editorului vin prin `StatusItems` (plan 04).
- `src/shared/components/ui/Toast.tsx`: prezentațional.
- `src/shared/components/layout/ToastViewport.tsx`:
  - conectat la store, cu timer de 1900ms;
  - `aria-live="polite"`; tonul `error` folosește border `--danger` și `role="alert"`.
- `src/shared/components/layout/StatusBar.tsx` (modificat):
  - props `left?: ReactNode`, `right?: ReactNode`;
  - componenta `StatusSegment` (dot opțional, mono opțional, `priority: 1 | 2 | 3`, `grow` pentru cale);
  - `container-type: inline-size` și regulile `@container` pe `data-priority`.
- `src/shared/utils/platform.ts`: `modKeyLabel(platform)` → `⌘` sau `Ctrl`, folosit în mesaje de tipul „⌘Z to undo”.
- `src/App.tsx` (modificat):
  - montează `ToastViewport`;
  - în status bar compune: starea, calea activă (placeholder „No file open” până la plan 11), `StatusItems` al editorului activ, eticheta temei și segmentul de zoom (contribuit de editorul de diagrame în plan 13).

## Pași
1. Slice-ul de notificări și `notify()`.
   Test: un al doilea `notify` înlocuiește primul, iar `dismissToast` îl șterge.
2. `Toast` și `ToastViewport`, cu timer resetat la fiecare `id` nou.
   Test cu `vi.useFakeTimers()`: dispare la 1900ms.
3. `status.store.ts`.
4. `StatusSegment` și `StatusBar` cu sloturi.
   Contribuțiile editoarelor (`StatusItems`) folosesc tot `StatusSegment`, deci respectă automat prioritățile.
   Test: segmentul primește `data-priority`; calea lungă se afișează trunchiată la mijloc, cu tooltip.
5. `platform.ts` + test.
6. Compunerea în `App.tsx`. Eticheta temei vine din `ui.store.resolvedTheme`.
7. Buton de test temporar în `App.tsx`, care apelează `notify('Hello')`, pentru verificare vizuală. Se șterge înainte de commit.

## Criterii de acceptare
- Toast-ul arată și se comportă ca în prototip, inclusiv înlocuirea și timer-ul.
- Status bar-ul afișează „Ready”, „No file open” și `DARK`/`LIGHT`, sincron cu tema.
- La 720×480 status bar-ul rămâne pe un rând, iar numele fișierului activ se vede.
- Orice modul poate notifica prin `useUiStore.getState().notify(...)` fără să importe alt modul.

## Commit
`feat(feedback): status bar segments and toast notifications`

## În afara scopului
Istoricul notificărilor sau centrul de notificări (nu există în design).
