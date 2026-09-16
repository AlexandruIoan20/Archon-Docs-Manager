# 01 — Design tokens & fonturi

## Scop
Definirea tuturor valorilor vizuale din prototip ca variabile CSS, expuse ca utilitare Tailwind v4.
Tema se schimbă doar prin atributul `data-theme` de pe `<html>`.
Fără UI nou în acest plan, doar fundația pe care o consumă toate componentele.

## Referință design

### Culori per temă

| Token | Dark | Light | Folosit la |
|---|---|---|---|
| `--bg` | `#0D0F16` | `#F8FAFC` | top bar, input-uri, modal |
| `--canvas` | `#111318` | `#FFFFFF` | canvas, document, tab activ |
| `--dot` | `#1a1d27` | `#E2E8F0` | grila de puncte |
| `--side` | `#0A0C11` | `#F1F5F9` | sidebar, tab bar, status bar, minimap |
| `--border` | `#1e2130` | `#E2E8F0` | toate liniile de 1px |
| `--surface` | `#161922` | `#FFFFFF` | properties panel, meniuri, noduri card |
| `--surface2` | `#12151d` | `#F8FAFC` | controale din toolbar, carduri din dialog |
| `--text` | `#E2E8F0` | `#0F172A` | text principal |
| `--text2` | `#8892A4` | `#64748B` | text secundar, iconițe |
| `--text3` | `#5b6478` | `#94A3B8` | placeholder, contoare, muchii |
| `--accent` | `#4F8EF7` | `#2563EB` | accent (configurabil) |
| `--on-accent` | `#071018` | `#FFFFFF` | text pe accent |

### Culori derivate din accent (calculate, nu hardcodate)

| Token | Dark | Light |
|---|---|---|
| `--accent-soft` | `color-mix(in oklab, var(--accent) 24%, var(--bg))` | 18% |
| `--accent-border` | `color-mix(in oklab, var(--accent) 48%, var(--bg))` | 45% |
| `--accent-text` | `color-mix(in oklab, var(--accent) 62%, var(--text))` | 80% |

### Culori semantice fixe
- `--danger: #DC2626`
- `--success: #22C55E` (punctul „Ready” din status bar)
- `--overlay: rgba(5,7,11,.62)`, cu `backdrop-filter: blur(2px)`

### Tipografie
- Familii: Inter 400/500/600/700 (UI) și JetBrains Mono 400/500 (id-uri, contoare, căi, zoom).
- Mărime de bază: 13px.
- Scara folosită: 10, 11, 12, 13, 14, 26px.
- Letter-spacing pentru etichetele uppercase: `.3px`–`.6px`.

### Raze, umbre, dimensiuni
- **Raze:** 3px (segmente), 4px (butoane, input-uri), 6px (meniuri, noduri, minimap), 8px (dropdown export, modal), 14px (hint pill), 50% (swatch, avatar).
- **Umbre:**
  - meniu: `0 12px 30px rgba(0,0,0,.45)`
  - modal: `0 24px 64px rgba(0,0,0,.6)`
  - toast: `0 10px 28px rgba(0,0,0,.45)`
  - nod: `0 1px 3px rgba(0,0,0,.35)`
- **Dimensiuni de layout:** top bar 48, tab bar 36, sidebar 260, properties 240, status bar 24, header sidebar 44, header properties 40.
- **Focus:** `outline: 2px solid var(--accent); outline-offset: 1px`.
- **Selecție de text:** `rgba(79,142,247,.3)`, derivată din accent.
- **Animație:** `@keyframes dashflow { to { stroke-dashoffset: -24 } }`.

## Dependențe
- npm: `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` (în `devDependencies`, fiindcă sunt împachetate de Vite).

## Fișiere
- `src/styles/variables.css`: tokenuri independente de temă (raze, umbre, dimensiuni, fonturi, culori semantice).
- `src/styles/themes/dark.css`: `:root, [data-theme='dark'] { … }`
- `src/styles/themes/light.css`: `[data-theme='light'] { … }`
- `src/styles/globals.css`: modificat. Importă Tailwind, fonturile, variabilele și temele, apoi declară `@theme inline`.
- `src/core/constants/layout.constants.ts`: dimensiunile de layout ca numere, pentru logica TS (ex. breakpoint-ul de auto-hide).

## Pași
1. Instalează fonturile: `npm i -D @fontsource-variable/inter @fontsource/jetbrains-mono`.
2. Creează `variables.css` cu:
   - `--font-sans`, `--font-mono`
   - razele (`--radius-xs` 3 … `--radius-xl` 14)
   - umbrele (`--shadow-node`, `--shadow-menu`, `--shadow-toast`, `--shadow-modal`)
   - înălțimile/lățimile de layout (`--size-titlebar`, `--size-tabbar`, `--size-sidebar`, `--size-inspector`, `--size-statusbar`)
   - `--danger`, `--success`, `--overlay`
3. Creează `themes/dark.css` și `themes/light.css` cu tabelul de culori de mai sus.
   Culorile derivate din accent se declară **o singură dată per temă** cu `color-mix`, referind `var(--accent)`.
   Astfel, schimbarea accentului (plan 05) recalculează automat toate derivatele.
4. În `globals.css`, adaugă un bloc `@theme inline` care mapează tokenurile pe namespace-urile Tailwind:
   - `--color-bg`, `--color-canvas`, `--color-side`, `--color-border`, `--color-surface`, `--color-surface-2`
   - `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`
   - `--color-accent`, `--color-accent-soft`, `--color-accent-border`, `--color-accent-fg`, `--color-on-accent`
   - `--color-danger`, `--color-success`
   - `--font-sans`, `--font-mono`, `--radius-*`, `--shadow-*`

   Rezultat: clase ca `bg-surface`, `text-fg-muted`, `border-border`, `font-mono`, `rounded-md`.
5. Tot în `globals.css`, adaugă stilurile de bază din prototip:
   - `body` cu `font-size: 13px` și `user-select: none` global; `text`/`input`/`textarea`/editorul TipTap reactivează selecția.
   - `input, textarea, button { font: inherit; color: inherit }`
   - regula `:focus-visible`, `::selection` și keyframe-ul `dashflow`.
6. Adaugă `data-theme="dark"` pe `<html>` în `index.html`, ca să nu existe flash la pornire. Plan 05 îl face dinamic.
7. Actualizează `backgroundColor` din `window-manager.ts` ca să corespundă cu `--bg` dark (`#0D0F16`).
8. Creează `layout.constants.ts`, cu valorile de mai sus exportate `as const`, plus `INSPECTOR_AUTOHIDE_BREAKPOINT = 1100`.
9. Înlocuiește clasele `neutral-*` din `App.tsx` provizoriu cu tokenurile noi, ca verificare vizuală.
10. Test (`src/styles/tokens.test.ts`): verifică că fiecare token din `dark.css` există și în `light.css`, parsând textul fișierelor.
    Previne derapajul dintre teme.

## Criterii de acceptare
- `bg-surface`, `text-fg-muted` etc. funcționează în JSX.
- Schimbarea manuală a `data-theme` în DevTools comută integral paleta.
- Fonturile se încarcă fără rețea: tab-ul Network din DevTools nu are cereri externe.
- Nicio culoare hex în afara fișierelor din `src/styles/` (verificare cu grep).
  Excepție: paleta de noduri din plan 14, care este dată salvată în fișier, nu temă.

## Commit
`feat(styles): design tokens, themes and bundled fonts`

## În afara scopului
Toggle-ul de temă, persistența preferinței și selecția accentului (toate în plan 05).
