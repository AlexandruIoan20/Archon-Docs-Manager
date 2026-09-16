# 16 — Properties panel

## Scop
Inspector-ul diagramei (contribuția `Inspector`), care editează nodul sau muchia selectată, exact ca panoul din prototip.

## Referință design
Panoul are 240px, fundal surface, border-left și header 40 „Properties” (plan 04). Conținutul: padding 12, coloană, gap 14.

1. **Rând de identitate:**
   - badge 22×22 r6, fundal `rgba(color,.18)`, iconiță 12 în culoarea nodului;
   - tipul (12px text2): „Action node” / „Decision node” / „Trigger node” / „Integration node”;
   - în dreapta, id-ul (mono 10 text3).
2. **NAME:** `Input` 30px, 13px.
3. **SUBTITLE:** `Input` 30px, 12px text2.
4. **COLOR:** 6 `Swatch`-uri 22px, gap 7. Selectatul are inel dublu (bg + accent).
5. **DESCRIPTION:** `Textarea` 74px.
6. **TAGS:** `TagInput`. Enter adaugă, × elimină.
7. **Secțiune separată** (border-top, pt12, gap 10):
   - „Retry on fail” (12px text2) + `Toggle`;
   - buton „Delete node” (h30, border, text `--danger`, 12px 500).
8. **Fără selecție:** „Nothing selected.<br>Pick a node on the canvas, or use the Add Node tool to place one.” (centrat, 12px text3, line-height 1.6, padding 24 16).

## Dependențe
- Plan 15.
- Plan 10, opțional pentru sugestiile de tag-uri.

## Decizii
- **Scrierea câmpurilor text:**
  - în timpul tastării: `updateNodeData(id, patch, { commit: false })` (fără snapshot);
  - la primul `change` după focus: un singur snapshot (`commit: true`).

  Astfel, un Ctrl+Z anulează toată editarea câmpului, nu literă cu literă.
- **Swatch, toggle, tag-uri:** câte un snapshot per acțiune.
- **„Retry on fail”** apare doar pentru tipurile cu `supportsRetry` (action, integration), fiindcă e o proprietate SOAR executabilă.
- **Selecție multiplă:** „N nodes selected”, COLOR aplicat tuturor și „Delete N nodes”.
- **Muchie selectată:** LABEL (`Input`) și „Delete edge”. Nu e în prototip, dar e necesar pentru editarea etichetelor de tipul „score ≥ 70”.
- **Shape / text selectat:** doar NAME (text) și o notă că stilul se editează din bara de sus.

## Fișiere
- `src/modules/diagram-editor/components/PropertiesPanel.tsx`: alege sub-panoul după selecție.
- `src/modules/diagram-editor/components/properties/NodeIdentity.tsx`
- `src/modules/diagram-editor/components/properties/NodeProperties.tsx`: câmpurile 2–7.
- `src/modules/diagram-editor/components/properties/MultiSelectionProperties.tsx`
- `src/modules/diagram-editor/components/properties/EdgeProperties.tsx`
- `src/modules/diagram-editor/components/properties/EmptySelection.tsx`
- `src/modules/diagram-editor/components/properties/Field.tsx`: `SectionLabel` + copil.
- `src/modules/diagram-editor/hooks/useSelectedElements.ts`: selectori din store (nod unic, noduri multiple, muchie).
- `src/modules/diagram-editor/hooks/useCommitOnFocus.ts`: logica „un snapshot per sesiune de editare”.
- `src/modules/diagram-editor/hooks/useTagSuggestions.ts`: `index:list-tags` (plan 10), afișate ca listă sub `TagInput` când input-ul are text.
- `src/modules/diagram-editor/index.ts` (modificat): contribuția primește `Inspector: PropertiesPanel`.

## Pași
1. `useSelectedElements` și teste.
2. `useCommitOnFocus` și teste: 5 tastări produc 1 snapshot, iar blur urmat de un nou focus produce un snapshot nou.
3. `Field`, `NodeIdentity`, `EmptySelection`.
4. `NodeProperties`, cu toate câmpurile legate de `updateNodeData`.
   Butonul „Delete node” folosește aceeași acțiune ca tasta Delete (inclusiv toast-ul).
5. `MultiSelectionProperties` și `EdgeProperties`.
6. `PropertiesPanel` și conectarea în contribuție.
   Închiderea panoului (× sau gear) folosește `ui.store`, iar selecția rămâne neschimbată.
7. `useTagSuggestions` (degradează elegant dacă indexul nu e gata).
8. **Accesibilitate:** fiecare câmp are `<label>` asociat (`SectionLabel` cu `htmlFor`), iar swatch-urile au `aria-label` cu numele culorii.
9. Teste:
   - editarea numelui actualizează nodul de pe canvas și istoricul are un singur pas;
   - swatch-ul schimbă culoarea;
   - Enter în tag-uri adaugă un tag;
   - toggle-ul Retry;
   - Delete node golește selecția și afișează starea goală.

## Criterii de acceptare
- Panoul arată identic cu prototipul pentru nodul „Analyze Indicators” (tag-uri `enrichment`, `t1566`, retry activ).
- Modificările apar instant pe canvas și se salvează prin autosave.
- Un singur Ctrl+Z anulează o editare completă a unui câmp.

## Commit
`feat(diagram-editor): properties panel for nodes and edges`

## În afara scopului
Proprietăți SOAR avansate (timeout, input/output mapping): extensie viitoare a `node-kinds`.
