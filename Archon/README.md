# SOAR Docs Studio

Cross-platform desktop app (Electron + React + TypeScript) for writing and managing
technical documentation and diagrams for SOAR platforms.

## Layout

- `electron/` — main process (`main.ts`), secure bridge (`preload.ts`), OS-level modules
- `src/` — React renderer (`core/`, `store/`, `modules/`, `shared/`, `styles/`)
- `formats/` — JSON schemas for `.soarws`, `.soardoc`, `.soardiag`

## Scripts

```bash
npm install          # also rebuilds native deps for Electron
npm run dev          # start with HMR
npm run typecheck    # strict TS for main + renderer
npm run lint
npm test             # Vitest + React Testing Library
npm run build:linux  # or build:win / build:mac
```
