# 05 — Theming: toggle, persistență, accent

## Scop
Tema dark/light comutabilă din TitleBar, persistată între sesiuni, cu opțiunea „system”.
Accentul este configurabil, iar preferințele de aspect ale diagramelor (din proprietățile prototipului) se stochează în același loc.

## Referință design
- Toggle 30×30 în TitleBar: iconiță `moon` pe dark, `sun` pe light.
- Status bar: eticheta `DARK` / `LIGHT` (mono), adăugată în plan 06.
- Proprietățile prototipului (`data-props`):
  - `accent`: `#4F8EF7` | `#22C55E` | `#F59E0B` | `#E8534F`;
  - `nodeStyle`: `card` | `outline` | `solid`;
  - `edgeStyle`: `curved` | `orthogonal` | `straight`.
- Derivatele accentului se calculează deja din CSS (plan 01). Aici se schimbă doar `--accent`.

## Dependențe
- Plan 04.
- Fără pachete npm noi (setările se salvează ca JSON, fără `electron-store`).

## Fișiere
- `src/core/types/settings.types.ts`:
  ```ts
  AppSettings {
    appearance: { theme: 'dark' | 'light' | 'system'; accent: AccentColor; nodeStyle; edgeStyle }
    recentWorkspaces: string[]
    session: {...}  // rezervat pentru plan 11
  }
  ```
- `src/core/constants/app.constants.ts` (modificat): `ACCENT_OPTIONS`, `DEFAULT_SETTINGS`.
- `electron/modules/settings/settings.ts`:
  - citire/scriere `userData/settings.json`, scriere atomică (`.tmp` + `rename`);
  - merge cu valorile implicite și cache în memorie.
- `electron/modules/ipc/settings.handler.ts`: `settings:get`, `settings:update` (patch parțial, validat), `system:get-theme`, eveniment `system:theme-changed` (din `nativeTheme`).
- `electron/modules/ipc/window.handler.ts` (modificat): `window:set-titlebar-colors` aplică `setTitleBarOverlay` pe Windows.
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
4. `window-manager.ts`: `backgroundColor` la creare se alege după tema salvată (dark `#0D0F16`, light `#F8FAFC`), ca să nu apară un flash alb sau negru.
5. `useSettings`.
6. `useTheme`, apelat o singură dată în `App.tsx`.
7. `main.tsx`: `await queryClient.fetchQuery(settings)`, apoi aplică tema, apoi `createRoot`.
8. Leagă `ThemeToggleButton` în `App.tsx`.
   Click-ul alternează dark ↔ light explicit; „system” se alege doar din setări, în viitor.
9. **Accent:** deocamdată fără UI dedicat.
   Se poate schimba din meniul „⋯” al workspace-ului (plan 08) cu cele 4 swatch-uri din `ACCENT_OPTIONS`.
   În acest plan, testează doar prin `settings:update`.
10. **Precedența `.soarws` → `settings.theme`:** câmpul din workspace este o suprascriere opțională (`'inherit'` implicit).
    Se documentează aici și se implementează în plan 07.
11. Teste:
    - `useTheme` setează `data-theme` corect pentru `dark`, `light` și `system`, cu mock pe `nativeTheme`;
    - toggle-ul apelează mutația.

## Criterii de acceptare
- Toggle-ul schimbă instant tema, iar după restart tema se păstrează.
- Cu `theme: 'system'`, schimbarea temei OS se reflectă live.
- Schimbarea accentului recolorează butoanele primare, selecțiile și inelele de focus, inclusiv derivatele.
- Pe Windows, simbolurile overlay-ului își schimbă culoarea cu tema.

## Commit
`feat(theme): persisted dark/light/system theme and accent`

## În afara scopului
Un ecran complet de Settings (nu există în design).
