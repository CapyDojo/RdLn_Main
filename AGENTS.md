# Repository Guidelines

## Required Dev Rules
- Always follow `docs/DevRules/Agent_Rules.md` and `docs/DevRules/DEVELOPMENT_GUIDELINES.md` during development.
- Key points: prefer native Windows commands, never run `git clean -fdx`, and use the CSS Debugging Protocol when fixing styles.

## Project Structure & Module Organization
- `src/`: React + TypeScript app (components, pages, services, hooks, utils, algorithms, styles, assets, types).
- `public/`: Static assets and `index.html`.
- `src-electron/`: Electron entry (`main.cjs`, `preload.cjs`, builder config).
- `src-tauri/`: Tauri app (`src/`, `Cargo.toml`, `tauri.conf.json`, `tessdata/`). Tauri builds are currently on hold.
- `tests/`: Vitest suites (unit, integration, performance, accuracy) plus helpers and fixtures; Playwright e2e.
- `scripts/`: Build/test utilities and OCR asset management.
- `dist/`, `dist-electron-new/`: Build outputs (ignored by linting).

## Architecture Overview
- Web: React + TypeScript via Vite; aliases `@` → `src`, `@tests` → `tests`.
- Desktop: Electron active (`src-electron/**`, `ELECTRON_BUILD` flag in scripts); Tauri paused.
- OCR: `tesseract.js`; assets managed by `scripts/download-*` and `scripts/copy-*`.

## Core Components & Flow
- `src/App.tsx`: Initializes providers (Layout, ScrollLock, ExperimentalLayout, Theme), renders `Header`, `StatusBar`, and `ComparisonInterface`. Cleans up OCR workers on unmount; exposes optional dev/test pages.
- `src/components/ComparisonInterface.tsx`: Central orchestrator. Uses `src/hooks/useComparison.ts` for the compare lifecycle (resource guardrails, cancellation via `AbortController`, progress/chunking, performance metrics). Chooses `src/components/DesktopInputLayout.tsx` / `src/components/MobileInputLayout.tsx`, manages side panels/overlays, and passes `result` to output.
- `src/components/TextInputPanel.tsx`: Two panels (Original/Revised). Handles typing, paste, and drag/drop. If an image is pasted/dropped, calls `src/hooks/useOCR.ts` to `extractTextFromImage` and inserts extracted text. Applies intelligent paste formatting (PDF/RTF/HTML) and provides language selection/auto‑detect controls.
- OCR services (`src/services/*.ts`):
  - `src/services/OCRService.ts` / `src/services/OCROrchestrator.ts`: Manage `tesseract.js` workers, queueing, termination.
  - `src/services/LanguageDetectionService.ts` + `src/services/BackgroundLanguageLoader.ts`: Detect languages and preload assets.
  - `src/services/OCRCacheManager.ts` / `src/services/OCRTextCleanupService.ts` / `src/services/OCRRouter.ts`: Cache, normalize, and route OCR flows.
- Diff engine (`src/algorithms/MyersAlgorithm.ts`): Core comparison algorithm; accepts a progress callback and respects a global abort signal for fast cancellation.
- Output (`src/components/OutputLayout.tsx` + `src/components/RedlineOutput.tsx`): Renders diffs with chunked strategy; reports stats back to `ComparisonInterface`.
- Controls & Stats: `src/components/DesktopControlsPanel.tsx` / `src/components/MobileControlsPanel.tsx`, `src/components/ProcessingDisplay.tsx`, `src/components/ComparisonStats.tsx`, `src/components/StatusBar.tsx` manage actions and display state.
- Contexts: `src/contexts/RdLnMemoryContext.tsx` (save/load sessions), `src/contexts/LayoutContext.tsx`, `src/contexts/ScrollLockContext.tsx` (scroll sync), `src/contexts/ThemeContext.tsx`, `src/contexts/FontSizeContext.tsx`, performance utilities.

Data flow summary
1) User types/pastes or pastes an image → `TextInputPanel` may run OCR → updates input state.
2) `ComparisonInterface` triggers `useComparison.compareDocuments()` (auto/manual).
3) Guardrails pass → `MyersAlgorithm.compare()` runs with progress and cancellation.
4) `result` set → `OutputLayout/RedlineOutput` render → stats emitted → controls/status/overlays update.

Key hooks
- `src/hooks/useComparison.ts`: Orchestrates compare lifecycle, guardrails, cancellation, progress.
- `src/hooks/useOCR.ts`: Wraps tesseract.js; extractTextFromImage + language/auto-detect state.
- `src/hooks/useResizeHandlers.ts`: CSS-first panel/output resizing with min/max constraints.
- `src/hooks/useScrollSync.ts`: Scroll lock and synchronized scrolling across panes.
- `src/hooks/useAutoScroll.ts`: Gentle auto-scroll of results during processing/display.
- `src/hooks/useResultsOverlay.ts` + `src/hooks/useJumpToResults.ts`: Overlay lifecycle and jump helpers.
- `src/hooks/usePerformanceMonitor.ts`: Operation/metric timing with safe fallbacks.
- `src/hooks/useUndoHistory.ts`: Undo stack for cleared inputs.
- `src/hooks/useMobileTabInterface.ts`: Mobile/desktop detection and panel visibility.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server for web.
- `npm run build` | `npm run build:web`: Production build to `dist/`.
- `npm run preview`: Preview the production build locally.
- `npm run electron:dev`: Vite + Electron desktop development.
- `npm run electron:build[:win|:mac|:linux]`: Package Electron app (see README → Windows/Electron Notes for artifact paths).
- Tauri: on hold — do not run `npm run tauri:dev` or `npm run tauri:build` until re-enabled.
- `npm test` | `npm run test:watch`: Run Vitest (watch or not).
- `npm run test:ocr`: OCR-focused suites (sequential; longer timeouts).
- `npm run test:e2e` | `:ui` | `:report`: Playwright end-to-end tests and report viewer.
- `npm run lint`: ESLint validation for the project.

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Vite. Use 2-space indentation.
- Components: PascalCase (`src/components/MyWidget.tsx`). Hooks: `use*` camelCase. `.ts`/`.tsx` file suffixes.
- Linting: Follow `eslint.config.js` (React Hooks and React Refresh rules enabled).
- Styling: Tailwind/PostCSS; prefer utility classes over ad hoc CSS.

## Testing Guidelines
- Frameworks: Vitest (unit/integration) and Playwright (e2e).
- Test files: `*.test.ts(x)`/`*.spec.ts(x)` under `tests/**`.
- Setup: `tests/setup.ts` (jsdom, globals). OCR config: `vitest.ocr.config.ts`.
- Coverage: `npm run test:coverage`; open `coverage/index.html`. OCR JSON: `test-results/ocr-results.json`.

## Commit & Pull Request Guidelines
- Commit format: `YYYYMMDD_type(scope): short message` (e.g., `20250821_refactor(ocr): …`).
- PRs: use `.github/PULL_REQUEST_TEMPLATE.md`; include linked issues, list of changes, before/after screenshots for UI, and note tests/coverage run.

## Security & Configuration Tips
- Assets: use `npm run download:all` and `npm run copy:tesseract`; do not commit large binaries or `tessdata` outputs.
- Secrets: never hardcode; use env or OS keychains.

## Performance & Memory
- OCR suites run serially; avoid running `npm run test:ocr` on every PR unless OCR logic changed.
- Prefer unit/integration tests for PRs; reserve OCR/Perf for targeted changes.

## Definition of Done
- Lint clean: `npm run lint` with no errors.
- Tests pass: `npm test` (unit/integration); run e2e if UI flows changed; OCR tests only when OCR logic changed.
- Docs updated where affected (`README.md`, `AGENTS.md`, or feature docs).
- UI changes include before/after screenshots.
- No secrets or large binaries committed; OCR assets handled via scripts.
- No `src-tauri/**` changes (on hold) unless explicitly approved.
- Followed `docs/DevRules/Agent_Rules.md` and `docs/DevRules/DEVELOPMENT_GUIDELINES.md`.
