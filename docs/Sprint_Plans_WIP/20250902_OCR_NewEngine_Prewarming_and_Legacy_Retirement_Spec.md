# OCR New Engine Adoption, Prewarming, and Legacy Retirement Spec

- Date: 2025-09-02
- Owners: OCR Platform Team
- Status: Draft (ready for implementation)

## Objectives

- Make `src/services/OCR_Engine_New.ts` the single source of truth for OCR (detection + extraction).
- Improve worker prewarming for faster first-run OCR with environment-aware paths.
- Retire legacy OCR engine and old language detection by moving them to `RetiredCode/` prior to removal.
- Keep behavior stable, improve performance and maintainability.

## TL;DR Decisions

- New Engine is canonical for extraction and auto-detect flows.
- Prewarming is kept and improved (env-aware, full detection languages).
- `OCR_Engine_Legacy.ts` and `LanguageDetectionService.ts` are retired (moved under `RetiredCode/`).
- `OCRService.detectLanguage()` is deprecated; call sites move to new engine semantics.

## Current State (from audit)

- Prewarming
  - `src/services/SimpleOCRCache.ts` prewarms detection with `['eng','osd']` only; not env-aware; logger typed as `any`.
  - `src/App.tsx:115` prewarms detection + English worker at startup and cleans up on unmount.
  - `src/services/PrewarmedOCRService.ts` attempts detect + extract with prewarmed workers but:
    - Assumes `detect()` returns `scripts[]`; tesseract v5 returns a single script summary.
    - Direct extraction bypasses OCR post-processing/normalization.
- Language detection
  - `src/services/LanguageDetectionService.ts` performs OSD detect and mapping; now optionally uses a prewarmed detection worker.
  - Several services/tests still reference it or go through `OCRService.detectLanguage()`.
- New engine
  - `src/services/OCR_Engine_New.ts` handles end-to-end recognition and tries prewarmed language worker first.
  - Feature flag is enabled to use the new engine.
- Legacy engine
  - `src/services/OCR_Engine_Legacy.ts` is only imported in `src/services/OCR_Engine.ts` as a compatibility layer.

## Scope

- In scope
  - Prewarming fixes (detection language set; env-aware worker creation; typing).
  - New engine as the only extraction path.
  - Retirement of legacy engine and old language detection by moving them to `RetiredCode/`.
  - Minimal call-site rewiring and test alignment.
- Out of scope
  - New OCR features.
  - Overhauling OCR post-processing (keep existing normalization).

## Target Architecture

- All UI and hooks call `OCR_Engine.extract(image, options)`.
- `OCR_Engine.extract` unconditionally delegates to `OCR_Engine_New.extract`.
- Auto-detect happens inside the new engine pipeline; no separate `detectLanguage()` API in app flows.
- Prewarming uses env-aware paths and the full detection language set.

## Changes Overview

1) Prewarming Improvements
- Primary: prewarm the multilingual extraction worker used by `OCR_Engine_New`:
  - Prewarm a single worker with the exact language set `OCR_Engine_New` will request (the 10-language set; include `'osd'` only if the engine requires it).
  - Provide a shared helper (e.g., `getNewEngineLanguagesForPrewarm()`) to avoid mismatches.
- Optional: prewarm a script detection (OSD) worker if still needed by any retained detect path:
  - Replace `['eng','osd']` with `DETECTION_LANGUAGES` from `src/config/ocrConfig.ts` if an OSD worker remains in use.
- Use centralized tesseract paths for reliability in Electron/offline:
  - Use `getTesseractConfig()` from `src/config/pathConfig.ts` with logger piping progress.
- Type logging correctly:
  - Use `Tesseract.LoggerMessage` and avoid `any`.

2) Canonicalize the New Engine
- `src/services/OCR_Engine.ts`:
  - Remove `OCR_Engine_Legacy` import and code path.
  - `extract(...)` always calls `OCR_Engine_New.extract(...)`.
  - `detectLanguages(...)` is deprecated; either:
    - Minimal: return `[]` with a warning, or
    - Optional bridge: call into `OCRService.detectLanguage` until tests are updated.

3) Retire Legacy + Old Detection (Archive First)
- Move the following to `RetiredCode/` (root-level, outside of TS build):
  - `src/services/OCR_Engine_Legacy.ts` → `RetiredCode/src/services/OCR_Engine_Legacy.ts`
  - `src/services/LanguageDetectionService.ts` → `RetiredCode/src/services/LanguageDetectionService.ts`
- Replace call sites:
  - OCR flows: depend on `OCR_Engine.extract(...)` only.
  - `OCRService.detectLanguage(...)` consumers migrated to extract-with-auto-detect (or return `[]`).
  - `OCROrchestrator`: replace detection phase with new engine flow if still used.
  - `App.tsx`: change prewarm from `['eng']` to the full multi-language set used by `OCR_Engine_New`.

4) Clean Up or Retire PrewarmedOCRService
- Prefer removing this service or adapting it to delegate to `OCR_Engine`/`OCRService` so output normalization is preserved.
- If kept, fix tesseract detect result parsing (single script summary in v5) and ensure extraction text passes through the same post-processing path.
- If the new engine fully covers prewarm usage, move `PrewarmedOCRService.ts` to `RetiredCode/` as well.

## File Impact (key references)

- `src/services/OCR_Engine_New.ts:11`
- `src/services/OCR_Engine.ts:28`
- `src/services/OCRService.ts:286`
- `src/services/LanguageDetectionService.ts:465`
- `src/services/SimpleOCRCache.ts:108`
- `src/App.tsx:115`

## Migration Plan

Stage 0 — Flag audit and guardrails
- Confirm `FEATURE_FLAGS.ENABLE_NEW_OCR_ENGINE` is on.
- Add a protective runtime warning if any legacy path is invoked.

Stage 1 — Prewarming fixes
- `SimpleOCRCache.prewarmDetectionWorker`:
  - Use `DETECTION_LANGUAGES` and `getTesseractConfig()`.
  - Type logger: `(m: Tesseract.LoggerMessage)`.
- `SimpleOCRCache.prewarmLanguageWorker`:
  - Use `getTesseractConfig()` and typed logger.
- `App.tsx` initialization:
  - Prewarm the multilingual extraction worker matching `OCR_Engine_New` language set (10-language worker) instead of only `['eng']`.
  - Log prewarm completion and cache stats; ensure cleanup still terminates workers on unmount.

Stage 2 — Canonicalize `OCR_Engine`
- Remove `OCR_Engine_Legacy` import and branches in `src/services/OCR_Engine.ts`.
- `extract(...)` calls `OCR_Engine_New.extract(...)` unconditionally.
- `detectLanguages(...)`:
  - Option A (strict): warn and return `[]`.
  - Option B (bridge): delegate to `OCRService.detectLanguage` temporarily (to be removed in Stage 4).

Stage 3 — Update Call Sites
- Replace any uses of `OCRService.detectLanguage(...)` with new engine flow or remove entirely if redundant.
- Ensure `src/services/OCROrchestrator.ts` uses extract-with-auto-detect or inlines new engine extraction.

Stage 4 — Archive Legacy Code
- Create `RetiredCode/` at repo root.
- Move:
  - `src/services/OCR_Engine_Legacy.ts` → `RetiredCode/src/services/OCR_Engine_Legacy.ts`.
  - `src/services/LanguageDetectionService.ts` → `RetiredCode/src/services/LanguageDetectionService.ts`.
  - (Optional) `src/services/PrewarmedOCRService.ts` if superseded → `RetiredCode/src/services/PrewarmedOCRService.ts`.
- Exclude RetiredCode from builds and lint:
  - Add `RetiredCode/**` to `tsconfig.json` `exclude`.
  - Add `RetiredCode/**` to ESLint ignore if needed.
  - Verify Vitest include patterns do not pick up `RetiredCode/**`.
- Move legacy tests:
  - Relocate tests that validate legacy engine or old detection behavior to `RetiredCode/tests/`.
  - Ensure Vitest excludes `RetiredCode/tests/**` from discovery and coverage.
- Update docs (README/Architecture) to reference the new canonical path and note retirement.

Stage 5 — Tests + Lint
- Update/remove tests referencing `LanguageDetectionService` and `OCRService.detectLanguage`:
  - Rewrite to validate new engine extract auto-detect behavior or mark as archived under `tests/archive/`.
- Lint only changed files; do not address unrelated lint debt.

## Acceptance Criteria

- Build, lint, and unit/integration tests pass for changed scope.
- No imports of `OCR_Engine_Legacy` or `LanguageDetectionService` remain under `src/`.
- `RetiredCode/**` excluded from TypeScript build, ESLint, and tests.
- On app init, the multilingual extraction worker (10-language) is prewarmed and cached.
- First extract operation uses a prewarmed worker (cache hit observed in logs) and preserves post-processing behavior.
- App prewarming logs show detection + English workers and use env-aware paths.
- Extraction output remains post-processed/normalized as before.
- Measurable first-run speed improvement (smoke metric from logs acceptable for this phase).

## Risks & Mitigations

- Risk: Hidden code relies on `OCRService.detectLanguage` behavior.
  - Mitigation: Provide bridge in `OCR_Engine.detectLanguages(...)` or in `OCRService` for one release; log warnings.
- Risk: Prewarming with CDN paths in offline/Electron.
  - Mitigation: Use `getTesseractConfig()` for worker/core/lang paths.
- Risk: Memory pressure from prewarmed workers.
  - Mitigation: Limit workers to detection + a small set (e.g., `eng`) by default; reuse across flows; clean up on unmount.
- Risk: `DETECTION_LANGUAGES` size increases prewarm time.
  - Mitigation: Stagger prewarm (detection first, then `eng`); defer additional language workers until first use.

## Feature Flags

- Keep `FEATURE_FLAGS.ENABLE_NEW_OCR_ENGINE` enabled for one release while monitoring.
- Plan removal (or hard-enable) after stabilization and test migration.

## Instrumentation

- Add timing logs/metrics for:
  - Extraction prewarm duration (10-language worker).
  - First extraction latency (before vs after prewarm), and cache hit/miss events.
- Optionally send aggregated metrics to analytics (respecting privacy/no-content logging).

### Suggested log tags (grep-friendly)
- Prewarm start: `OCR:prewarm:start`
- Prewarm done: `OCR:prewarm:done {durationMs, languages}`
- Cache hit: `OCR:cache:hit {type, key}`
- Cache miss: `OCR:cache:miss {type, key}`
- First extract timing: `OCR:extract:first {durationMs, languages}`

## Rollback Plan

- Revert to previous commit; or re-enable legacy by restoring files from `RetiredCode/` and re-adding old imports in `OCR_Engine.ts`.
- Turn off prewarming if needed by disabling the prewarm call in `src/App.tsx`.

## Work Breakdown

- Prewarming fixes (env + languages + typing): 0.5–1 day
- Canonicalize engine + call-site updates: 0.5–1 day
- Archive legacy + test updates: 1–2 days
- Docs updates and smoke validation: 0.5 day

## Appendix: Concrete Fix List

- `SimpleOCRCache.prewarmDetectionWorker`
  - Use `DETECTION_LANGUAGES` instead of `['eng','osd']`.
  - Pass `await getTesseractConfig(onProgress)` as options to `createWorker`.
  - Type logger param as `Tesseract.LoggerMessage`.
- `SimpleOCRCache.prewarmLanguageWorker`
  - Pass `await getTesseractConfig(onProgress)`; type logger.
- `PrewarmedOCRService`
  - Prefer delegating to `OCR_Engine`/`OCRService` to preserve post-processing.
  - If kept, fix tesseract detect result parsing (single script) and types.
- `OCR_Engine.ts`
  - Remove legacy import/branches; route to new engine only.
- `OCROrchestrator`
  - Replace detection phase with new engine flow or make it opt-in/retired if redundant.
- Move to `RetiredCode/`:
  - `src/services/OCR_Engine_Legacy.ts`
  - `src/services/LanguageDetectionService.ts`
  - (Optional) `src/services/PrewarmedOCRService.ts`

## Quick Validation Steps (Agent)

- Prewarm + cache validation
  - Start dev server: `npm run dev`.
  - Observe logs: `OCR:prewarm:start` then `OCR:prewarm:done ...` and `simpleCache.totalWorkers >= 1`.
  - Trigger OCR (paste an image). Expect `OCR:cache:hit` for language worker.

- Lint/type checks for touched files
  - Run: `npx eslint src/services/SimpleOCRCache.ts src/services/OCR_Engine.ts src/services/OCR_Engine_New.ts`.

- Unit smoke
  - Run: `npx vitest run src/services/__tests__/SimpleOCRCache.prewarming.test.ts`.

## Config Snippets

tsconfig.json (exclude RetiredCode)
```
{
  "exclude": [
    "RetiredCode/**/*"
  ]
}
```

.eslintignore
```
RetiredCode/**
```

vitest.config.ts (exclude RetiredCode)
```
test: {
  exclude: [
    'tests/e2e/**/*',
    'node_modules/**/*',
    'tests/archive/**/*',
    'RetiredCode/**/*'
  ],
  coverage: {
    exclude: [
      'RetiredCode/**'
    ]
  }
}
```

## Task Checklist (Trackable)

Stage 0 — Flags and Guardrails
- [ ] Verify `FEATURE_FLAGS.ENABLE_NEW_OCR_ENGINE` is enabled in `src/config/appConfig.ts`.
- [ ] Add runtime warning if any legacy code path is invoked (temporary safety net).

Stage 1 — Prewarming
- [ ] Add a shared helper to return the exact multilingual language set used by `OCR_Engine_New` for extraction.
- [ ] Update `SimpleOCRCache.prewarmLanguageWorker()` to use `getTesseractConfig()` and typed logger.
- [ ] Update `SimpleOCRCache.prewarmDetectionWorker()` to use `DETECTION_LANGUAGES`, `getTesseractConfig()`, and typed logger.
- [ ] In `src/App.tsx`, prewarm the multilingual extraction worker (10-language set) on init (replace `['eng']`).
- [ ] Log prewarm completion and cache stats; keep cleanup terminating workers on unmount.

Stage 2 — Canonicalize Engine
- [ ] In `src/services/OCR_Engine.ts`, remove `OCR_Engine_Legacy` import and code branches.
- [ ] Make `extract(...)` unconditionally call `OCR_Engine_New.extract(...)`.
- [ ] Deprecate `detectLanguages(...)` (warn + return `[]`) or temporarily bridge to `OCRService.detectLanguage(...)` if needed.
- [ ] Update `src/services/OCROrchestrator.ts` to use `OCR_Engine.extract(...)` with auto-detect instead of separate detection.

Stage 3 — PrewarmedOCRService Cleanup
- [ ] Decide: retire `PrewarmedOCRService.ts` or delegate to `OCR_Engine`/`OCRService`.
- [ ] If kept: fix detect result parsing (single script summary) and ensure extraction text uses standard post-processing.

Stage 4 — Archive Legacy Code
- [ ] Create `RetiredCode/` (root-level) and subfolders mirroring current paths.
- [ ] Move `src/services/OCR_Engine_Legacy.ts` → `RetiredCode/src/services/OCR_Engine_Legacy.ts`.
- [ ] Move `src/services/LanguageDetectionService.ts` → `RetiredCode/src/services/LanguageDetectionService.ts`.
- [ ] (Optional) Move `src/services/PrewarmedOCRService.ts` → `RetiredCode/src/services/PrewarmedOCRService.ts`.
- [ ] Move legacy/detection tests to `RetiredCode/tests/`.
- [ ] Exclude `RetiredCode/**` from `tsconfig.json`, ESLint, and Vitest discovery.

Stage 5 — Tests and Lint
- [ ] Update/remove tests referencing `LanguageDetectionService` and `OCRService.detectLanguage`.
- [ ] Ensure new-engine flows pass unit/integration suites most impacted by OCR.
- [ ] Lint changed files; resolve type issues in `SimpleOCRCache` and `PrewarmedOCRService` (if retained).

Stage 6 — Instrumentation and Docs
- [ ] Add logs/metrics: prewarm duration (10-language), first extraction latency, cache hit/miss.
- [ ] Update README/Architecture to declare `OCR_Engine_New` as canonical and note legacy retirement.

Release Readiness Checklist
- [ ] On app init, the multilingual extraction worker is prewarmed and cached.
- [ ] First extract uses prewarmed worker (cache hit observed in logs) and preserves post-processing behavior.
- [ ] No imports of `OCR_Engine_Legacy` or `LanguageDetectionService` remain under `src/`.
- [ ] `RetiredCode/**` excluded from builds, lint, and tests.
- [ ] Before/after first extraction time shows improvement in logs.
