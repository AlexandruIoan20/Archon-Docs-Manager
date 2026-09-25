# 05 — Theming, layout persistat & zoom interfață

## Scop
Tema dark/light comutabilă din TitleBar, persistată între sesiuni, cu opțiunea „system”.
Accentul este configurabil, iar preferințele de aspect ale diagramelor (din proprietățile prototipului) se stochează în același loc.
Tot aici se persistă layout-ul (lățimile și vizibilitatea panourilor, poziția ferestrei) și se adaugă zoom-ul interfeței, partea de responsive care are nevoie de setări.

## Referință design
- Toggle 30×30 în TitleBar: iconiță `moon` pe dark, `sun` pe light.
- Status bar: eticheta `DARK` / `LIGHT` (mono), adăugată în plan 06.
- Proprietățile prototipului (`data-props`):
  - `accent`: `#4F8EF7` | `#22C55E` | `#F59E0B` | `#E8534F`;
  - `nodeStyle`: `card` | `outline` | `solid`;
  - `edgeStyle`: `curved` | `orthogonal` | `straight`.
- Derivatele accentului se calculează deja din CSS (plan 01). Aici se schimbă doar `--accent`.
- **Zoom interfață:** `Ctrl/Cmd+=` mărește, `Ctrl/Cmd+-` micșorează, `Ctrl/Cmd+0` revine la 100%.
  Treptele sunt 80 / 90 / 100 / 110 / 125 / 150%, iar la fiecare schimbare apare toast-ul „Zoom 125%” (după plan 06).

## Dependențe
- Plan 04.
- Fără pachete npm noi (setările se salvează ca JSON, fără `electron-store`).

## Fișiere
- `src/core/types/settings.types.ts`:
  ```ts
  AppSettings {
    appearance: { theme: 'dark' | 'light' | 'system'; accent: AccentColor; nodeStyle; edgeStyle; uiZoom: number }
    layout: { sidebar: { visible: boolean; width: number }; inspector: { visible: boolean; width: number } }
    window: { bounds: { x; y; width; height } | null; maximized: boolean }
    recentWorkspaces: string[]
    session: {...}  // rezervat pentru plan 11
  }
  ```
- `src/core/constants/app.constants.ts` (modificat): `ACCENT_OPTIONS`, `DEFAULT_SETTINGS`, `UI_ZOOM_STEPS`.
- `electron/modules/settings/settings.ts`:
  - citire/scriere `userData/settings.json`, scriere atomică (`.tmp` + `rename`);
  - merge cu valorile implicite și cache în memorie.
- `electron/modules/ipc/settings.handler.ts`: `settings:get`, `settings:update` (patch parțial, validat), `system:get-theme`, eveniment `system:theme-changed` (din `nativeTheme`).
- `electron/modules/ipc/window.handler.ts` (modificat):
  - `window:set-titlebar-colors` aplică `setTitleBarOverlay` pe Windows;
  - `window:set-zoom` aplică `webContents.setZoomFactor` (valoare validată între 0.8 și 1.5).
- `electron/modules/window-bounds.ts` (modificat): `resolveInitialBounds` primește și bounds-urile salvate; le folosește doar dacă intersectează cel puțin 50% dintr-un display existent, altfel revine la regula din plan 03.
- `electron/modules/window-state.ts`: salvează `window.bounds` și `maximized` la `resize`/`move`/`maximize` (debounce 500ms) și la `close`.
- `src/shared/hooks/useLayoutPersistence.ts`: hidratează `ui.store.panels` din setări înainte de primul render și salvează modificările (debounce 300ms, fără scrieri în timpul drag-ului).
- `src/shared/hooks/useUiZoom.ts`: comenzile de zoom, cu scrierea în setări.
- `src/shared/hooks/useSettings.ts`: `useQuery(settings)` + `useMutation(update)`, cu actualizare optimistă.
- `src/shared/hooks/useTheme.ts`:
  - rezolvă tema efectivă (`system` → `nativeTheme`);
  - setează `document.documentElement.dataset.theme` și `style.setProperty('--accent', …)`;
  - trimite culorile către overlay-ul de titlu.
- `src/store/ui.store.ts` (modificat): `resolvedTheme`, oglindit de `useTheme` ca să fie citit sincron de componente.
- `src/main.tsx` (modificat): încarcă setările **înainte** de primul render, ca tema să nu clipească.

## Pași
1. Tipurile de setări și valorile implicite.
2. `settings.ts` în main.
   Validează la citire: valorile necunoscute se înlocuiesc cu implicitele, iar un JSON corupt se redenumește în `settings.corrupt-<ts>.json`.
   Test unitar în Node, cu `fs` pe un director temporar.
3. `settings.handler.ts`. Contractul IPC se extinde cu `settings:get`, `settings:update`, `system:get-theme` și evenimentul `system:theme-changed`.
4. `window-manager.ts`:
   - `backgroundColor` la creare se alege după tema salvată (dark `#0D0F16`, light `#F8FAFC`), ca să nu apară un flash alb sau negru;
   - bounds-urile inițiale vin din `resolveInitialBounds` cu valorile salvate, iar `maximized` se reaplică înainte de `show`;
   - `setZoomFactor(appearance.uiZoom)` înainte de `show`;
   - `webContents.setVisualZoomLevelLimits(1, 1)` dezactivează pinch-zoom-ul, iar zoom-ul implicit Chromium (din meniu) se înlocuiește cu comanda noastră, ca valoarea să fie mereu cea persistată;
   - `window-state.ts` se atașează ferestrei.

   Teste pentru `resolveInitialBounds`: bounds pe un monitor deconectat → centrat pe ecranul curent; bounds mai mari decât ecranul → limitate.
5. `useSettings`.
6. `useTheme`, apelat o singură dată în `App.tsx`.
7. `main.tsx`: `await queryClient.fetchQuery(settings)`, apoi aplică tema, apoi `createRoot`.
8. `useLayoutPersistence` și `useUiZoom`, apelate o singură dată în `App.tsx`.
   Shortcut-urile de zoom se adaugă lângă cele din plan 04 (se mută în registrul din plan 20).
   Test: o lățime salvată în afara limitelor se aduce în limite la hidratare.
9. Leagă `ThemeToggleButton` în `App.tsx`.
   Click-ul alternează dark ↔ light explicit; „system” se alege doar din setări, în viitor.
10. **Accent:** deocamdată fără UI dedicat.
    Se poate schimba din meniul „⋯” al workspace-ului (plan 08) cu cele 4 swatch-uri din `ACCENT_OPTIONS`.
    În acest plan, testează doar prin `settings:update`.
11. **Precedența `.arws` → `settings.theme`:** câmpul din workspace este o suprascriere opțională (`'inherit'` implicit).
    Se documentează aici și se implementează în plan 07.
12. Teste:
    - `useTheme` setează `data-theme` corect pentru `dark`, `light` și `system`, cu mock pe `nativeTheme`;
    - toggle-ul apelează mutația.

## Criterii de acceptare
- Toggle-ul schimbă instant tema, iar după restart tema se păstrează.
- Cu `theme: 'system'`, schimbarea temei OS se reflectă live.
- Schimbarea accentului recolorează butoanele primare, selecțiile și inelele de focus, inclusiv derivatele.
- Pe Windows, simbolurile overlay-ului își schimbă culoarea cu tema.
- Lățimile și vizibilitatea panourilor, poziția și starea maximizată a ferestrei se păstrează după restart.
- Cu un monitor extern deconectat între sesiuni, fereastra apare pe ecranul disponibil.
- La zoom 150% pe 1440×900, layout-ul se comportă ca la 960×600 (inspector overlay, TitleBar `compact`), fără elemente tăiate.

## Commit
`feat(theme): persisted theme, accent, layout and ui zoom`

## În afara scopului
Un ecran complet de Settings (nu există în design).
