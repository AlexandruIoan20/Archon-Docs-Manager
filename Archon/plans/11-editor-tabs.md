# 11 — Tab system & EditorPane

## Scop
Bara de tab-uri din prototip, starea fișierelor deschise, zona centrală care alege editorul după tipul de fișier și ecranul de bun venit.

## Referință design
- **Tab bar:** h36, fundal `--side`, border-bottom, `align-items: stretch`.
- **Tab:**
  - padding 0 14, gap 8, border-right, cursor pointer;
  - iconiță 13: file (document) sau flow (diagramă), accent dacă tab-ul e activ, altfel text2;
  - nume 12px 500;
  - **punct „dirty”** 5×5 accent, dacă fișierul are modificări nesalvate;
  - buton close 16×16 r3, cu × 11px text2.
  - **Activ:** fundal `--canvas`, `border-top: 2px solid var(--accent)`, text.
  - **Inactiv:** transparent, `border-top: 2px solid transparent`, text2.
- **Butonul „+”** de la final (padding 0 12, text3, plus 14): deschide modalul „New diagram”.
- **Închiderea tab-ului activ** activează ultimul tab rămas.
- **Calea fișierului activ** apare în status bar (mono).

## Dependențe
- Plan 09.
- Fără pachete npm noi.

## Fișiere
- `src/store/editor.store.ts` (complet):
  ```ts
  interface EditorTab { id: string; relPath: string; kind: FileKind; title: string; dirty: boolean }
  state: { tabs: EditorTab[]; activeId: string | null }
  actions: openFile, activate, close, closeOthers, closeToRight, reorder,
           setDirty(id, bool), renameTabPath(old, new), closeByPath(prefix)
  selectors: selectActiveTab
  ```
- `src/modules/editor/hooks/useEditorTabs.ts`: combină store-ul cu gărzile de ieșire (dirty → confirmare).
- `src/modules/editor/components/EditorTabs.tsx`: bara și scroll-ul orizontal la overflow, cu roata mouse-ului.
- `src/modules/editor/components/EditorTab.tsx`
- `src/modules/editor/components/EditorPane.tsx`:
  - găsește contribuția după `kind` și randează `Editor`;
  - `kind` necunoscut → `EmptyState` cu eroare;
  - fără tab-uri → `WelcomeScreen`;
  - fiecare editor e învelit într-un error boundary.
- `src/modules/editor/components/EditorErrorBoundary.tsx`: singura excepție de la „doar componente funcționale”, deoarece React nu oferă error boundaries funcționale.
  Excepția se documentează în comentariu.
- `src/modules/editor/components/WelcomeScreen.tsx`:
  - fundal canvas, conținut centrat;
  - acțiuni „New diagram” / „New document”, care deschid modalul sau notifică prin `ui.store`;
  - lista de shortcut-uri cu `Kbd`.
- `src/modules/editor/components/UnsavedChangesModal.tsx`: Save / Don't save / Cancel (`ModalId` `'unsaved-changes'`).
- `src/modules/editor/index.ts`: `EditorTabs`, `EditorPane`, `useActiveTab`.
- `src/App.tsx` (modificat):
  - `EditorTabs` în slotul `tabBar`, `EditorPane` în `main`;
  - `Toolbar` / `TitleActions` / `Inspector` / `StatusItems` ale contribuției active, în sloturile lor;
  - calea activă în status bar.

## Pași
1. `editor.store.ts` complet, cu teste pentru fiecare acțiune:
   - `openFile` pe un fișier deja deschis doar îl activează;
   - `close` pe tab-ul activ activează ultimul tab rămas;
   - `closeByPath` închide și fișierele din foldere șterse.
2. **Persistența sesiunii:** tab-urile și tab-ul activ se salvează în `settings.session.tabsByWorkspace[workspaceId]` (debounce 500ms) și se restaurează la deschiderea workspace-ului.
   Fișierele care nu mai există se omit.
3. `EditorTab` și `EditorTabs`:
   - middle-click închide;
   - `role="tablist"` / `role="tab"`, `aria-selected`;
   - butonul close are `aria-label` „Close <name>”.
4. **Gardă pentru modificări nesalvate:**
   - `close` pe un tab `dirty` deschide `UnsavedChangesModal`;
   - „Save” cere editorului să salveze printr-un callback înregistrat de editor în `useEditorTabs` (`registerSaveHandler(tabId, fn)`), deci fără import între module.
5. **Reconciliere cu discul:** la `workspace:tree-changed`, tab-urile ale căror fișiere au dispărut se închid (cu toast „<name> was deleted”), iar redenumirile făcute din aplicație actualizează `relPath` prin `renameTabPath`.
6. `EditorPane` și `EditorErrorBoundary`.
7. `WelcomeScreen`.
8. Butonul „+” → `openModal('new-diagram')`. Până la plan 17, modalul lipsește, iar `ModalHost` ignoră id-ul neînregistrat.
9. **Shortcut-uri:** `Ctrl/Cmd+W` închide tab-ul; `Ctrl+Tab` / `Ctrl+Shift+Tab` ciclează între tab-uri. Se mută în registrul din plan 20.
10. **Fereastra:** la închiderea aplicației cu tab-uri `dirty`, main-ul cere confirmarea renderer-ului (`app:before-quit` → răspuns).
11. Teste de componente:
    - tab activ stilizat;
    - punctul dirty;
    - închiderea cu gardă;
    - `EditorPane` alege contribuția corectă (contribuții mock).

## Criterii de acceptare
- Comportament identic cu prototipul la deschidere, activare și închidere.
- Tab-urile se restaurează după restart.
- Un editor care aruncă o eroare nu dărâmă aplicația.
- `modules/editor` nu importă nimic din `document-editor` sau `diagram-editor`.

## Commit
`feat(editor): tab system, editor pane and session restore`

## În afara scopului
Split view și tab-uri fixate (nu există în design).
