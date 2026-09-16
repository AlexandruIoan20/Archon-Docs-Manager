# 08 — Sidebar & file tree

## Scop
Conținutul sidebar-ului de 260px din prototip: header de workspace, comutatorul Files/Diagrams, butonul „New”, arborele cu linii de ghidaj și căutarea.
Butonul „New” e doar UI aici; acțiunile lui se leagă în plan 09.

## Referință design
- **Header (h44, border-bottom, padding 0 12):**
  - badge 18×18 r4 accent-soft cu inițiala (10px 700 accent-text);
  - nume 13px 600 și chevron 12;
  - în dreapta, iconița „more” (⋯) 14 text2.
- **Files/Diagrams (padding 10 12 8, gap 4):**
  - două butoane flex-1 h28 r4 12px 500, cu iconițe folder / flow 13;
  - activ: fundal surface + text; inactiv: transparent + text2;
  - „Diagrams” filtrează arborele doar la `.soardiag`.
- **Split button „New” (padding 0 12 12):**
  - principal h30 flex-1, accent, iconiță plus 14 și „New” 12px 600;
  - chevron 26×30.
  - Meniul inline (nu popover) apare sub buton, cu `margin: -8px 12px 10px`, r6, border, surface, p4.
    Opțiuni: „New diagram…”, „New document”, „New folder” (h28 12px).
- **Arbore (flex-1, overflow-y auto, padding 0 6), rânduri h26 r4 gap 6, `padding-left: 6 + depth*14`:**
  - **folder:**
    - chevron 12 (chevD / chevR) text2 și iconiță folder 14 (accent dacă e folder-țintă, altfel text2);
    - nume 13px ellipsis și contor de fișiere recursiv (mono 10 text3, dreapta);
    - folderul-țintă are fundal `color-mix(in oklab, var(--accent-soft) 60%, transparent)`.
  - **fișier:**
    - spațiu gol de 12px și iconiță file (document) sau flow (diagramă) 14;
    - rândul activ: fundal accent-soft, `box-shadow: inset 2px 0 0 var(--accent)`, text; inactiv: text2.
  - **linii de ghidaj:** câte una verticală de 1px `--border` pentru fiecare nivel de adâncime, la `left: 13 + i*14`, pe toată înălțimea rândului, deci continue între rânduri.
    Referință: imaginea de arbore din proiectul de design.
  - **click pe folder:** comută expandarea **și** îl setează ca folder-țintă („saves to”).
  - **click pe fișier:** deschide tab-ul (plan 11).
  - **stare goală la căutare:** „No files match “q”” (12px text3, centrat, padding 20 10).
  - **cu query activ:** toate folderele cu potriviri sunt expandate forțat, iar cele fără potriviri sunt ascunse.
- **Footer (border-top, padding 10 12, gap 8):**
  - `SearchInput` „Search files”;
  - `IconButton` gear 28×28, care comută inspector-ul.

## Dependențe
- Plan 07.
- Fără pachete npm noi.

## Fișiere
- `src/store/workspace.store.ts` (modificat): `expanded: Record<string, boolean>` (cheie `relPath`), `targetFolder: string` (`''` = root), `sideTab: 'files' | 'diagrams'`, `query`, cu acțiunile aferente.
  Expandarea se persistă per workspace în setări (`session`), cu debounce.
- `src/modules/workspace/utils/flatten-tree.ts`:
  - funcție pură `flattenTree(tree, { expanded, query, sideTab, activePath, targetFolder }) → TreeRow[]`;
  - `countFiles(entry)`, respectând filtrul `sideTab`;
  - teste exhaustive (filtru, query, contoare, adâncime).
- `src/modules/workspace/components/WorkspaceHeader.tsx`, cu meniul de switch (recente, Open…, Create…, Close) și meniul „⋯” (Reveal in file manager, Accent color, Close workspace).
- `src/modules/workspace/components/SidebarTabs.tsx`: `SegmentedControl`.
- `src/modules/workspace/components/NewMenu.tsx`: `SplitButton` și meniul inline. Callback-urile vin prin props.
- `src/modules/workspace/components/FileTree.tsx`: `role="tree"`, navigare cu tastatura.
- `src/modules/workspace/components/FileTreeNode.tsx`: un rând (`role="treeitem"`, `aria-expanded`, `aria-level`).
- `src/modules/workspace/components/TreeGuides.tsx`
- `src/modules/workspace/components/SidebarFooter.tsx`
- `src/modules/workspace/components/WorkspaceSidebar.tsx`: compune tot și e exportat din `index.ts`.
- `src/store/editor.store.ts` (creat minimal): `activePath: string | null` și `openFile(relPath, kind)`. Plan 11 îl completează. Aici e necesar doar ca tree-ul să aibă o țintă.

## Pași
1. Extinde `workspace.store`.
2. `flatten-tree.ts` și testele lui, **înaintea** componentelor. Toată logica prototipului (`walk`, `hasMatch`, `visibleFile`) ajunge aici, fără JSX.
3. `TreeGuides` și `FileTreeNode`, prezentaționale, cu props tipate.
4. `FileTree`:
   - randează `TreeRow[]`;
   - tastatura: ↑/↓ mută focusul; → expandează sau intră în folder; ← restrânge sau urcă la părinte; Enter deschide sau comută; Home/End.
   - Peste ~500 de rânduri se adaugă virtualizare (notat ca optimizare; nu se implementează acum).
5. `SidebarTabs`, `NewMenu` (meniul se închide la Escape și la click-outside), `SidebarFooter`.
6. `WorkspaceHeader`, cu meniurile construite din `Menu`.
   Accentul se alege din 4 `Swatch`-uri și se salvează cu `settings:update`.
7. `WorkspaceSidebar`, montat în slotul `sidebar` din `App.tsx`.
8. `editor.store` minimal. Click pe fișier → `openFile` (în `EditorPane` apare deocamdată doar calea).
9. **Persistența expandării:** `session.expandedByWorkspace[workspaceId]` în setări.
10. Teste de componente:
    - click pe folder → comută și setează ținta;
    - query fără rezultate → mesajul gol;
    - tab-ul Diagrams ascunde documentele;
    - navigarea cu tastatura.

## Criterii de acceptare
- Aspect identic cu prototipul, în ambele teme, pentru un workspace cu structura: `Playbooks/Phishing`, `Playbooks/Ransomware`, `Runbooks`, `Architecture/Reference`.
- Contoarele sunt recursive și respectă filtrul Diagrams.
- Liniile de ghidaj sunt continue, fără goluri între rânduri.
- Arborele se actualizează singur când un fișier e adăugat din afara aplicației.
- Niciun fișier din `modules/workspace` nu depășește 200 de linii.

## Commit
`feat(workspace): sidebar with file tree, filters and search`

## În afara scopului
Creare, redenumire și ștergere (plan 09), meniu contextual (plan 20), drag & drop pentru mutare (plan 09, opțional).
