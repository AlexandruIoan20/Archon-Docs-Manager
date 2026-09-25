# 00 — Overview: de la prototipul Archon la Archon Docs Studio

Sursa de design: Claude Design → `Archon Prototype.dc.html` (1440×900, temă dark/light).
Referință suplimentară: `uploads/pasted-…png`, un arbore de foldere cu linii de ghidaj verticale/orizontale.
Stilul de ghidaj al file tree-ului vine din această imagine.

Prototipul este **un singur component monolit**: stare, stiluri inline și logică în aceeași clasă.
Nu îl portăm 1:1. Îl descompunem pe modulele din arhitectura oficială și îl implementăm plan cu plan.

---

## Ordinea planurilor

Fiecare plan = un commit (sau câteva commit-uri mici, dacă planul o cere explicit).
Nu se începe un plan până când cel anterior nu îndeplinește criteriile de acceptare.

| # | Plan | Faza din roadmap | Depinde de |
|---|------|------------------|------------|
| 01 | [Design tokens & fonturi](01-design-tokens.md) | F1 | setup ✅ |
| 02 | [Primitive UI partajate](02-shared-ui-primitives.md) | F1 | 01 |
| 03 | [TitleBar & fereastră frameless](03-titlebar-frameless.md) | F1 | 02 |
| 04 | [Layout shell & contribuții de editor](04-layout-shell.md) | F1 | 03 |
| 05 | [Theming, layout persistat & zoom interfață](05-theming.md) | F1 | 04 |
| 06 | [Status bar & notificări (toast)](06-status-bar-toasts.md) | F1 (infra din F5, adusă înainte) | 05 |
| 07 | [Workspace în procesul main](07-workspace-main.md) | F2 | 06 |
| 08 | [Sidebar & file tree](08-sidebar-file-tree.md) | F2 | 07 |
| 09 | [CRUD fișiere & formate](09-file-crud-formats.md) | F2 | 08 |
| 10 | [SQLite: index & metadata](10-sqlite-index.md) | F2 | 09 |
| 11 | [Tab system & EditorPane](11-editor-tabs.md) | F3 | 09 |
| 12 | [Document editor (TipTap)](12-document-editor.md) | F3 | 11 |
| 13 | [Diagram canvas (React Flow)](13-diagram-canvas.md) | F4 | 11 |
| 14 | [Noduri & muchii SOAR](14-diagram-nodes-edges.md) | F4 | 13 |
| 15 | [Unelte canvas, stil, undo/redo](15-diagram-tools-history.md) | F4 | 14 |
| 16 | [Properties panel](16-properties-panel.md) | F4 | 15 |
| 17 | [Dialogul „New diagram” (catalog UML)](17-new-diagram-dialog.md) | F4 | 16 |
| 18 | [Mermaid editor](18-mermaid-editor.md) | F4 | 17 |
| 19 | [Export PNG/SVG/PDF/XMI](19-export.md) | F4 | 17 |
| 20 | [Global search, shortcuts, context menus](20-search-shortcuts-context-menus.md) | F5 | 10, 19 |

Planurile 10 și 11 pot rula în paralel după 09. 12 și 13 pot rula în paralel după 11. 18 și 19 pot rula în paralel după 17.

**De ce 06 vine înaintea workspace-ului:** în prototip, orice acțiune pe fișiere confirmă printr-un toast („Folder created”, „Document created in …/”).
Infrastructura de notificări trebuie deci să existe când se scriu operațiile CRUD.

---

## Harta design → arhitectură

| Zonă din prototip (px) | Unde ajunge |
|---|---|
| Top bar 48px (logo, unelte, stroke/fill/weight/font, undo/redo, Export, theme, avatar) | `shared/components/layout/TitleBar.tsx` + sloturi contribuite de editorul activ (plan 03, 15, 19) |
| Tab bar 36px | `modules/editor/components/EditorTabs.tsx` (plan 11) |
| Sidebar 260px (workspace header, Files/Diagrams, New split-button, tree, search) | `modules/workspace/*` (plan 08) |
| Canvas cu grilă de puncte, zoom, minimap, hint | `modules/diagram-editor/components/DiagramCanvas.tsx` (plan 13) |
| Noduri card/outline/solid, romb pentru decizie | `modules/diagram-editor/components/nodes/*` (plan 14) |
| Document view (path, titlu 26px, coloană 640px) | `modules/document-editor/*` (plan 12) |
| Properties panel 240px | `modules/diagram-editor/components/PropertiesPanel.tsx` (plan 16) |
| Status bar 24px | `shared/components/layout/StatusBar.tsx` (plan 06) |
| Modal „New diagram” 940×712 | `modules/diagram-editor/components/new-diagram/*` (plan 17) |
| Toast | `shared/components/ui/Toast.tsx` + `store/ui.store.ts` (plan 06) |

---

## Decizii arhitecturale (valabile pentru toate planurile)

1. **Compoziția se face în `App.tsx`, nu în module.**
   Modulele nu se importă între ele. `EditorPane`, TitleBar și panoul din dreapta nu știu ce e o diagramă.
   Fiecare modul-editor exportă o **contribuție** (`EditorContribution`: `Editor`, `Toolbar?`, `Inspector?`), iar `App.tsx` le înregistrează.
   Tipul trăiește în `src/core/types/editor.types.ts`. Adăugarea unui editor nou nu atinge restul aplicației.
2. **Store-uri globale doar pentru stare transversală.**
   `workspace.store` (tree, folder țintă), `editor.store` (tab-uri, activ, dirty), `ui.store` (temă, panouri, modal activ, toast, status).
   Starea internă a unei diagrame (selecție, istoric undo, unealta activă) stă într-un store **local modulului**: `modules/diagram-editor/store/`.
   Motivul: store-ul global nu trebuie să cunoască forma unui nod.
3. **Stilurile vin din tokenuri, niciodată hardcodate.**
   Prototipul folosește stiluri inline cu hex-uri. Noi le mapăm pe variabile CSS (plan 01), expuse ca utilitare Tailwind v4 prin `@theme`.
   Singura excepție sunt culorile semantice ale nodurilor (paleta de 6), care sunt **date**, nu temă.
4. **Iconițe: registru propriu, fără dependență nouă.**
   Prototipul are un set propriu de path-uri SVG (stil Lucide, stroke 1.5).
   Le păstrăm într-un registru tipat, `shared/components/icons/`, pentru fidelitate vizuală și zero dependențe.
5. **Fonturile se împachetează local** (`@fontsource-variable/inter`, `@fontsource/jetbrains-mono`).
   CSP-ul aplicației (`default-src 'self'`) blochează Google Fonts, iar o aplicație desktop trebuie să meargă offline.
6. **Formatele de fișier rămân cele din specificație** (`.arws`, `.ardoc`, `.ardiag`), nu `.md` / `.diagram` din prototip.
   `.ardiag` se extinde cu câmpurile cerute de design (plan 09).
7. **Documentele folosesc TipTap**, nu `<textarea>` ca în prototip. Din prototip păstrăm doar aspectul vizual (plan 12).
8. **Canvas-ul folosește React Flow** (`@xyflow/react`), nu implementarea manuală din prototip.
   Designul nodurilor, muchiilor, minimap-ului și controalelor de zoom se reproduce peste React Flow.
9. **Layout responsive.** Prototipul are 1440×900 fix.
   Aplicația trebuie să funcționeze de la 720×480 (px CSS, după scalarea OS) până la ultrawide și 4K.
   Regulile sunt în secțiunea [Strategie responsive](#strategie-responsive) și se aplică în fiecare plan cu UI.
10. **Fiecare fișier are maximum 200 de linii.** Unde prototipul are funcții mari (`renderVals`), planurile indică explicit spargerea în componente și hook-uri.

### Abateri față de structura de foldere din specificație (toate aditive)

- `src/core/types/editor.types.ts`: contractul `EditorContribution`.
- `src/core/editor/`: contextul React prin care shell-ul citește contribuțiile înregistrate în `App.tsx`.
- `src/core/schemas/`: scheme `zod` pentru `.arws`, `.ardoc`, `.ardiag`. Tipurile TS se derivă din ele, iar main-ul validează la citire.
- `src/shared/components/icons/`: registrul de iconițe.
- `src/modules/*/store/`: store-uri locale de modul.
- `src/modules/diagram-editor/components/new-diagram/`, `.../edges/`, `.../canvas/`: subcomponente, pentru limita de 200 de linii.
- `electron/modules/ipc/window.handler.ts`, `workspace.handler.ts`, `settings.handler.ts`: handlere IPC pe domenii.
- `electron/modules/settings/`: preferințe la nivel de aplicație (temă, accent, workspace-uri recente).

---

## Strategie responsive

### Ținte
Dimensiunile sunt în px CSS, adică după scalarea sistemului de operare. Pixelii fizici nu contează: Electron scalează singur.

| Ecran (rezoluție × scalare OS) | Viewport CSS util | Rezultat așteptat |
|---|---|---|
| 1280×720 × 150% | ~853×440 | sidebar și inspector ca overlay, TitleBar `minimal` |
| 1366×768 × 125% | ~1093×570 | sidebar fix, inspector overlay, TitleBar `compact` (`full` pe macOS) |
| 1920×1080 × 150% | ~1280×680 | toate panourile fixe, TitleBar `full` |
| 1440×900 × 100% | 1440×860 | identic cu prototipul |
| 1920×1080 × 100% | 1920×1040 | identic cu prototipul, zona centrală mai lată |
| 2560×1440, 3440×1440, 4K × 100% | ≥ 2560 | panouri lărgibile, zoom de interfață disponibil |

### Principii
1. **Fără media queries pe DPI.** Totul se exprimă în px CSS și tokenuri.
2. **Fereastra:** minimum 720×480. Dimensiunea inițială se limitează la zona de lucru a ecranului (plan 03), iar poziția și mărimea se restaurează doar dacă încap pe un ecran existent (plan 05).
3. **Shell-ul decide dispunerea panourilor** printr-o funcție pură, `resolvePanelLayout` (plan 04).
   Funcția pornește de la lățimea ferestrei și de la lățimile curente ale panourilor, nu de la breakpoint-uri fixe.
4. **Panourile laterale au trei stări:** `docked`, `overlay`, `hidden`.
   Când lipsește spațiul, panoul devine overlay (sertar peste zona centrală), iar preferința utilizatorului rămâne salvată.
5. **Panourile se pot redimensiona** între limite, iar lățimea se persistă.
6. **Componentele reacționează la containerul lor, nu la fereastră.**
   Se folosesc CSS container queries (`container-type: inline-size`) pentru status bar, inspector, dialoguri, ecrane goale și document.
7. **TitleBar-ul are trei densități:** `full`, `compact`, `minimal`, calculate din lățimea disponibilă a barei (plan 03).
   Contribuțiile editoarelor le citesc cu `useTitleBarDensity()` și își restrâng uneltele în meniuri. Nicio comandă nu dispare: ce nu încape trece într-un meniu „⋯”.
8. **Elementele flotante nu ies din fereastră.** Meniurile, tooltip-urile și dropdown-urile se poziționează cu flip/shift în viewport (plan 02).
   Modalele folosesc `min(<lățime design>, 100vw - 32px)` și au corpul cu scroll.
9. **Nimic nu produce scroll orizontal la nivelul ferestrei.**
   Textul lung se trunchiază cu ellipsis și tooltip, iar căile se trunchiază la mijloc, ca numele fișierului să rămână vizibil.
10. **Zoom de interfață între 80% și 150%**, persistat (plan 05).
    Zoom-ul schimbă viewport-ul CSS, deci regulile de mai sus se adaptează singure. Pe 4K, interfața se poate mări fără să se strice layout-ul.

### Praguri (`src/core/constants/layout.constants.ts`, plan 04)

| Constantă | Valoare | Rol |
|---|---|---|
| `SIDEBAR_WIDTH` | implicit 260, între 200 și 420 | lățimea sidebar-ului |
| `INSPECTOR_WIDTH` | implicit 240, între 220 și 380 | lățimea inspector-ului |
| `MAIN_MIN_WITH_INSPECTOR` | 600 | inspector-ul e `docked` doar dacă zona centrală păstrează ≥ 600px |
| `MAIN_MIN_WITH_SIDEBAR` | 640 | sidebar-ul e `docked` doar dacă zona centrală păstrează ≥ 640px |
| `TITLEBAR_DENSITY` | `full` ≥ 1000, `compact` ≥ 700, altfel `minimal` | pragurile se aplică lățimii disponibile a barei, fără spațiul rezervat controalelor native |

Cu lățimile implicite, inspector-ul rămâne fix de la 1100px, iar sidebar-ul de la 900px.
Dacă utilizatorul lărgește un panou, pragurile cresc automat.

### Unde se implementează

| Plan | Contribuția responsive |
|---|---|
| 02 | poziționare flip/shift pentru `Menu`/`Tooltip`, `Modal` limitat la viewport, `useElementSize`, `truncateMiddle` |
| 03 | fereastră limitată la zona de lucru, minimum 720×480, densitățile TitleBar-ului |
| 04 | `resolvePanelLayout`, panouri redimensionabile, overlay pentru sidebar și inspector |
| 05 | persistarea lățimilor și a vizibilității, poziția ferestrei, zoom de interfață |
| 06 | segmentele status bar-ului cu prioritate, toast cu lățime limitată |
| 07, 17, 20 | carduri, dialoguri și paleta de căutare adaptate cu container queries |
| 08, 16 | conținutul se adaptează la lățimea variabilă a panoului |
| 11 | tab-uri cu lățime minimă/maximă, meniu cu toate tab-urile la overflow |
| 12, 13, 18 | coloana documentului, overlay-urile canvas-ului și split view-ul Mermaid se adaptează la container; bara de formatare respectă densitatea |
| 15, 19 | uneltele diagramei și butonul Export respectă densitatea TitleBar-ului |

### Matrice de verificare
Fiecare plan cu UI se verifică vizual la:
- 720×480 (minimul);
- 1093×570 (laptop 1366×768 la 125%);
- 1440×900 (prototipul);
- 2560×1440;
- 1440×900 cu zoom de interfață 150% (echivalent 960×600), după plan 05.

La toate dimensiunile: niciun element tăiat, niciun scroll orizontal pe fereastră, toate comenzile accesibile.

---

## Decizii deschise (de confirmat înainte de planul indicat)

| Întrebare | Default propus | Plan |
|---|---|---|
| Brand în TitleBar: „Archon” (design) sau „Archon Docs Studio” (spec)? | Un singur loc: `APP_NAME` în `app.constants.ts` | 03 |
| Avatarul „DR” din TitleBar: aplicația nu are conturi | Nu se implementează. Slotul rămâne liber | 03 |
| Exportul „UML XMI” | Ultimul pas din plan 19, opțional | 19 |
| Controlul „FILL” (static în prototip) | Implementat ca selector de fill pentru shape-uri (rect/ellipse) | 15 |

---

## Convenții comune pentru fiecare plan

- **Structura unui plan:** Scop → Referință design → Dependențe → Fișiere → Pași → Criterii de acceptare → Commit → În afara scopului.
- **Pașii sunt ordonați** și fiecare lasă proiectul compilabil (`npm run typecheck`).
- **Dependențele npm** se instalează în pasul în care sunt folosite prima dată, nu mai devreme.
- **Planurile cu UI** trec prin [matricea de verificare responsive](#matrice-de-verificare) înainte de commit.
- **La finalul fiecărui plan** trebuie să treacă: `npm run typecheck && npm run lint && npm test && npx electron-vite build`.
- **Commit:** `feat(<modul>): <descriere>`.
