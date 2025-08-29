codex
Here’s a clear map of the current OCR lifecycle: what files exist, what each does, and how they interact.

Entry Points

- Text input: src/components/TextInputPanel.tsx
  
  - Uses useOCR() to handle paste/drop of images and run OCR.
  - Calls extractTextFromImage(file) and appends extracted text to the textarea.
  - Tracks OCR events via AnalyticsService and performance utils.
  - Tracks OCR events via AnalyticsService and performance utils.

- 

- Note: When autoDetect is true, useOCR first calls OCRService.detectLanguage, but then passes options.languages = undefined to OCRService.extractTextFromImage, which
  may trigger a second detection inside OCRService (duplication risk).

Core Services (Top-Level)

- src/services/OCRService.ts
  
  - Public API: detectLanguage(image), extractTextFromImage(image, options).
  - Routing: Uses OCRRouter to choose provider (currently always falls back to web/Electron functions).
  - Extraction paths:
  - Orchestrated (optional): when `options.useOrchestrator` is true → `OCROrchestrator.extractText(...)`.
  - Legacy (default): Determine languages (auto-detect or options), initialize worker via `OCRCacheManager.initializeWorker(langs)`, `worker.recognize(image)`, then
    `multiLanguagePostProcessing(text, langs)`.

- Manages worker/detection caches (workers map, detectionWorker, languageCache), with cleanup timers.

- Depends on:
  
  - `LanguageDetectionService` (for auto-detect),
  - `OCRCacheManager` (worker creation/cache),
  - `OCROrchestrator` (optional path),
  - `OCRRouter` (environment routing).

- src/services/OCROrchestrator.ts
  
  - A higher-level flow with analytics:
  1) Language detection via `LanguageDetectionService.detectLanguage`.
  2) Worker init via `initializeOptimalWorker()` -> tries `BackgroundLanguageLoader` then `OCRCacheManager`.
  3) `tesseractWorker.recognize(image)`.
  4) Text cleanup via `OCRTextCleanupService.processText(text, detectedLanguages, options.textProcessing)`.
  5) Performance metrics recorded with `PerformanceMonitor`.

- Returns text + metrics; tracks cache hits/background loader usage.

Language Detection

- src/services/LanguageDetectionService.ts
  - quickPreScreening(file): infer languages from filename hints (fast path).
  - detectLanguage(imageFile, onProgress?):
  - Tries `quickPreScreening`.
  - Checks `OCRCacheManager.checkLanguageCache`.
  - Initializes an OSD-capable detection worker via `OCRCacheManager.initializeDetectionWorker(onProgress)`.
  - Runs `worker.detect(image)` (OSD) and maps script → languages, stores in cache.
  - Fallback to English on failure (also cached).
- Single-phase (optional utility): extractTextWithLanguageDetection(image, options) returns both text and detected languages using a comprehensive 10-language worker;
  also has combined cache (text+langs). Not wired into useOCR path; orchestration path uses separate detection and cleanup.

Worker, Caching, and Paths

- src/services/OCRCacheManager.ts
  
  - Provides:
  - Language detection cache: `checkLanguageCache`, `storeLanguageCache`.
  - Worker cache and cleanup (LRU/expiry; `getCachedWorker` and `getCacheStats`).
  - Progressive worker strategies (fast English-first → then enhance; memory pressure eviction).
  - Detection worker with OSD support: `initializeDetectionWorker(onProgress)` with detailed progress mapping.
  - Deprecated helpers bridged to the new factory.

- Delegates worker creation to:
  
  - `OCRWorkerFactory.createWorker({ languages, deployment, enableOSD, performanceMode, timeout, onProgress })`.

- Uses:
  
  - `src/config/pathConfig.ts` for env-aware resource paths (web/CDN vs Electron local).
  - `src/config/tesseractConfig.ts` for performance parameters per use case and language optimizations.
  - `src/config/ocrConfig.ts` for cache timings and detection language sets.
  - `src/utils/ocrErrorHandling.ts` for robust error categorization/recovery.

- src/services/OCRRouter.ts
  
  - Environment routing stub. Currently always uses the fallback (web/Electron) implementations for OCR and language detection; Tauri provider not implemented.
  - Environment routing stub. Currently always uses the fallback (web/Electron) implementations for OCR and language detection; Tauri provider not implemented.

- 

Post-Processing

- src/services/OCRTextCleanupService.ts
  
  - Modular text cleanup pipeline:
  - Language selection (capability priority).
  - Language-specific cleaning (CJK spacing rules, French punctuation spacing, German umlauts, Spanish punctuation).
  - Character/number fixes, legal terminology fixes.
  - Intelligent paragraph reconstruction (conservative) and universal preservation utilities.
  - Final cleanup while preserving paragraphs.

- Output: text + processing time + applied processors list.
  Output: text + processing time + applied processors list.

- 

- 

Configs, Types, and Errors

- src/config/ocrConfig.ts: Supported languages, detection language set, cache configuration, preprocessing presets.
- src/types/ocr-types.ts: Core OCR types (languages, options, worker cache structures, progress callbacks).
- src/config/pathConfig.ts: Env detection + resource path resolution (CDN for web/localhost; local paths for Electron).
- src/config/tesseractConfig.ts: Performance modes and language-specific parameter tweaks (OEM/PSM handled at creation time).
- src/utils/ocrErrorHandling.ts: Normalized error detection, recovery recommendations, timeout helpers, worker validation wrappers.

End-to-End Lifecycle Summary

1. User pastes/drops image in TextInputPanel → calls useOCR.extractTextFromImage(image).
2. useOCR:
   - Sets phase to initialization with progress.
   - If autoDetect: calls OCRService.detectLanguage(image); internally uses LanguageDetectionService.detectLanguage:
- Updates detected languages in hook state.
3. useOCR then begins extraction phase, remaps progress 0.6–1.0 and calls OCRService.extractTextFromImage:
   
   - Orchestrated path (if enabled): detection (again), worker init via OCRCacheManager/BackgroundLanguageLoader, recognize, then cleanup via OCRTextCleanupService.
   - Legacy/default path: pick languages (may detect again if options.languages not set), init worker via OCRCacheManager, recognize, then do
     OCRService.multiLanguagePostProcessing.

4. useOCR updates UI progress, sets final progress: 100 and resets after brief delay.
   
   - OCRService, LanguageDetectionService (single-phase), and OCRTextCleanupService all contain processing logic. Consolidate on OCRTextCleanupService.
- Background loader integration mismatch:
  
  - BackgroundLanguageLoader references OCRService.getWorkerForLanguage, which doesn’t exist (should call OCRCacheManager or provide a thin wrapper).

- Routing abstraction:
  
  - OCRRouter is a stub; currently no Tauri-specific provider is implemented.
    Key Files & Roles

- UI/hook: src/components/TextInputPanel.tsx, src/hooks/useOCR.ts

- Service orchestration: src/services/OCRService.ts, src/services/OCROrchestrator.ts

- Language detection: src/services/LanguageDetectionService.ts

- Workers/cache: src/services/OCRCacheManager.ts, src/services/OCRRouter.ts

- Post-processing: src/services/OCRTextCleanupService.ts, src/services/ocr/utils/ParagraphReconstructionUtils.ts

- Preprocessing (unused): src/services/ocr/utils/ImagePreprocessingService.ts

- Configs/errors: src/config/ocrConfig.ts, src/config/pathConfig.ts, src/config/tesseractConfig.ts, src/utils/ocrErrorHandling.ts

Would you like me to draft a refactor plan addressing the detection duplication, unify post-processing into OCRTextCleanupService, and tighten the orchestration path as
the single flow?

user
so is the end-to-end lifecycle currently fully gated behind useOCR?  because I am planning to completely remove the lifecycle between "If autoDetect:" all the way to post-processed text being passed
back to textinputpanel, with a completely rewritten pipeline. i want to understand and prepare for that complete code swap out/in. does that make sense?

thinking
