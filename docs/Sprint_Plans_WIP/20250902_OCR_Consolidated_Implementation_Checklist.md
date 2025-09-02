# OCR Consolidated Implementation Checklist

- Date: 2025-09-02
- Status: Ready for implementation and tracking

This is the merged, tracked checklist derived from:
- docs/Sprint_Plans_WIP/20250902_OCR_NewEngine_Prewarming_and_Legacy_Retirement_Spec.md
- docs/Sprint_Plans_WIP/20250902-OCR-Performance-Optimization-Spec.md

How to use
- Check off items as they land. Keep tasks scoped and PRs small.
- Follow Dev Rules, lint/tests must pass. Prefer Windows-native commands.
- No src-tauri changes; handle OCR assets via scripts.

Legend
- [ ] = pending, [x] = complete
- Phase numbering uses x.y (phase x, task x.y)

## Phase 0 — Canonical Engine, Prewarming, Legacy Retirement (Stabilize)

- [ ] 0.1 Canonicalize `OCR_Engine.extract` to `OCR_Engine_New`
  - Route `src/services/OCR_Engine.ts` `extract(...)` unconditionally to `OCR_Engine_New.extract(...)`.
  - Remove `OCR_Engine_Legacy` import/branches.
  - Deprecate `detectLanguages(...)`: return `[]` with a console warning OR temporarily bridge to `OCRService.detectLanguage` until tests migrate.

- [ ] 0.2 Centralize prewarm language set
  - Add `getNewEngineLanguagesForPrewarm()` (e.g., in `src/config/ocrConfig.ts`) returning the exact multi-language set used by `OCR_Engine_New`.
  - Include `'osd'` only if actually used by the new engine.

- [ ] 0.3 SimpleOCRCache: env-aware prewarming + typing
  - In `src/services/SimpleOCRCache.ts`, update detection prewarm to use `DETECTION_LANGUAGES` (from `src/config/ocrConfig.ts`) instead of `['eng','osd']` if OSD worker is retained.
  - Pass `await getTesseractConfig(onProgress)` from `src/config/pathConfig.ts` when creating workers (detection and language).
  - Type logger as `Tesseract.LoggerMessage` (remove `any`).

- [ ] 0.4 App prewarm behavior
  - In `src/App.tsx`, prewarm the multilingual extraction worker using `getNewEngineLanguagesForPrewarm()`; keep unmount cleanup.
  - Optionally prewarm OSD detection worker only if still referenced anywhere.

- [ ] 0.5 Archive legacy detection/engine to `RetiredCode/`
  - Move files:
    - `src/services/OCR_Engine_Legacy.ts` → `RetiredCode/src/services/OCR_Engine_Legacy.ts`
    - `src/services/LanguageDetectionService.ts` → `RetiredCode/src/services/LanguageDetectionService.ts`
    - If not needed: `src/services/PrewarmedOCRService.ts` → `RetiredCode/src/services/PrewarmedOCRService.ts`
  - Exclude `RetiredCode/**` from TypeScript, ESLint, and Vitest discovery:
    - `tsconfig.json` → `exclude: ["RetiredCode/**/*"]`
    - `.eslintignore` → `RetiredCode/**`
    - `vitest.config.ts` → ensure tests ignore `RetiredCode/**`

- [ ] 0.6 Move or retire legacy-only tests
  - Relocate legacy engine/detection tests to `RetiredCode/tests/` or `tests/archive/` and ensure Vitest ignores them.

- [ ] 0.7 Rewire call sites to new engine semantics
  - Replace `OCRService.detectLanguage(...)`/`LanguageDetectionService` usage with `OCR_Engine.extract(..., { autoDetect: true })`.
  - Ensure `OCROrchestrator` runs the new engine flow and removes redundant detection phases.

- [ ] 0.8 Instrumentation for prewarm/extract/cache
  - Add grep-friendly tags and timing logs:
    - `OCR:prewarm:start`, `OCR:prewarm:done {durationMs, languages}`
    - `OCR:cache:hit {type, key}`, `OCR:cache:miss {type, key}`
    - `OCR:extract:first {durationMs, languages}`

- [ ] 0.9 Phase 0 verification and acceptance
  - Dev smoke: `npm run dev`, paste image, observe prewarm logs and first extract cache hit.
  - Lint/tests: `npm run lint`, `npm test` clean; verify no imports of legacy/detection remain under `src/**`.

## Phase 1 — Foundation Upgrades (SIMD, Upgrade, Baselines)

- [ ] 1.1 Upgrade Tesseract.js to v6.0.0+
  - Update `package.json`; run install; adjust worker init options if API changed.
  - Restrict outputs to text-only where possible.

- [ ] 1.2 Enable WebAssembly SIMD with graceful fallback
  - Ensure build/runtime enable SIMD where supported; fallback to non-SIMD cleanly.
  - Document browser support and fallback in `README.md`.

- [ ] 1.3 Replace DOM-based post-processing with string ops
  - In `src/services/OCR_Engine_New.ts`, remove DOM element usage for CJK/post-normalization; replace with optimized string/regex logic.
  - Preserve exact output behavior.

- [ ] 1.4 Cache consolidation (step 1): unified manager scaffolding
  - Define unified cache interfaces/policies in `src/services/OCRCacheManager.ts` (or new `UnifiedOCRCacheManager.ts`).
  - Migrate `SimpleOCRCache` to delegate to the unified manager without changing behavior.

- [ ] 1.5 Establish performance baselines
  - Add lightweight perf harness under `tests/perf/**` to record: startup time, first extract latency, memory peak.
  - Capture baseline logs before/after upgrade and SIMD.

- [ ] 1.6 Phase 1 verification and acceptance
  - Lint/tests pass; perf deltas recorded (expect faster startup, smaller downloads).
  - Verify SIMD active on supported browsers; fallback works.

## Phase 2 — Architecture Improvements (Pooling, Preprocessing, Progressive)

- [ ] 2.1 CPU-aware worker pool and scheduling
  - Implement `OCRWorkerPool` (or extend `OCROrchestrator`) with pool sizing by CPU cores, worker reuse, and task scheduling.
  - Respect `AbortController` from `src/hooks/useComparison.ts`.

- [ ] 2.2 Smart language detection optimization (if any detect path remains)
  - Batch similar images; extend cache TTL to 60+ minutes based on confidence.
  - Expose cache stats via unified cache manager.

- [ ] 2.3 Advanced image preprocessing pipeline (optional toggles)
  - Integrate OpenCV.js/WASM modules for CLAHE, binarization, denoise.
  - Configure in `src/config/ocrConfig.ts` with safe defaults and flags.

- [ ] 2.4 Progressive loading and memory pressure handling
  - Add chunked processing for >2MB images and streaming progress to UI.
  - Monitor memory usage and throttle concurrency when needed.

- [ ] 2.5 Memory management enhancements
  - Add worker refresh cycles and explicit cleanup paths for long sessions; instrument memory usage.

- [ ] 2.6 Cache consolidation (step 2): finalize and remove redundancy
  - Complete migration to the unified cache; remove overlapping caches.

- [ ] 2.7 Phase 2 verification and acceptance
  - Tests for worker pool fairness/cancellation; stress large images; stable memory under load.

## Phase 3 — Advanced Acceleration (GPU, WASM Modules, Persistence)

- [ ] 3.1 WebGPU/WebGL acceleration prototype behind feature flag
  - Implement GPU-accelerated preprocessing with WebGPU; add WebGL fallback.
  - Capability checks; progressive enhancement.

- [ ] 3.2 Custom SIMD-optimized WASM preprocessing modules
  - Implement specialized modules and integrate via heuristics based on document type.

- [ ] 3.3 Persistent caching (IndexedDB) with TTL/LRU
  - Add IndexedDB-backed cache to unified manager; enable cross-session persistence and startup warm-up.

- [ ] 3.4 Parallel multi-stage processing pipeline
  - Background preprocessing and predictive loading based on usage patterns.

- [ ] 3.5 AI-assisted optimization (optional)
  - Auto-tune preprocessing parameters; document-type-specific profiles with feature flag.

- [ ] 3.6 Phase 3 verification and acceptance
  - Cross-browser matrix, hardware fallbacks verified; no accuracy regressions; feature flags default off until validated.

## Cross-Cutting Tasks

- [ ] 4.1 Update tests and coverage
  - Migrate/retire tests for `LanguageDetectionService` and `OCRService.detectLanguage`; add tests for new engine auto-detect and unified cache stats.
  - Keep OCR heavy suites opt-in (only when OCR logic changes).

- [ ] 4.2 Documentation updates
  - Update README/architecture to reflect canonical engine and legacy retirement; document SIMD/GPU requirements and flags.

- [ ] 4.3 Instrumentation standardization
  - Ensure log tag consistency and minimal performance counters; avoid content logging.

- [ ] 4.4 Build/config hardening
  - Verify `RetiredCode/**` remains excluded in tsconfig, ESLint, and Vitest; re-check after refactors.

- [ ] 4.5 Feature flags and rollout
  - Keep `FEATURE_FLAGS.ENABLE_NEW_OCR_ENGINE` on for a release; plan to hard-enable after stabilization and test migration.

- [ ] 4.6 Repo rules and assets
  - No large binaries committed; use `npm run download:all` and `npm run copy:tesseract` for OCR assets; no `src-tauri/**` changes.

## Success Metrics (Track During/After Phases)

- [ ] 5.1 Performance KPIs achieved
  - Startup <500ms; processing <2s/page typical; memory peak <200MB; cache hit rate >90%; error rate <1%.

- [ ] 5.2 Technical KPIs achieved
  - >85% coverage for new modules; Chrome/Firefox/Safari/Edge supported; mobile <5s/page; no accuracy regressions.

## Quick Verification Commands

- Lint/type: `npm run lint`
- Unit/integration: `npm test`
- OCR suites (targeted): `npm run test:ocr`
- E2E (if UI flow changes): `npm run test:e2e`
- Dev smoke logs: `npm run dev` (watch for `OCR:*` tags)

